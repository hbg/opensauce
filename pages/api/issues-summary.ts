import type { NextApiRequest, NextApiResponse } from 'next';

// Minimal structure we care about, matching the mapped object from /api/issues
interface SimpleComment {
  user: string;
  body: string;
  url: string;
}

interface SimpleIssue {
  id: number;
  url: string;
  title: string;
  body: string;
  number: number;
  user: string;
  comments: SimpleComment[];
}

const OPENAI_MODEL = 'gpt-3.5-turbo';

async function collectRepoSnippets(owner: string, repo: string, githubToken?: string): Promise<string> {
  try {
    const headers: Record<string, string> = { 'Accept': 'application/vnd.github+json' };
    if (githubToken) headers.Authorization = `Bearer ${githubToken}`;

    const treeResp = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`, { headers });
    if (!treeResp.ok) return '';
    const treeJson = await treeResp.json();
    const files = (treeJson.tree || []).filter((n: any) => n.type === 'blob' && n.size < 10000);
    // prioritise README and src files
    const prioritized = files.sort((a: any, b: any) => {
      const score = (f: any) => (/readme/i.test(f.path) ? 0 : f.path.startsWith('src') ? 1 : 2);
      return score(a) - score(b);
    }).slice(0, 20);

    let snippets = '';
    for (const file of prioritized) {
      const fileResp = await fetch(file.url, { headers });
      if (!fileResp.ok) continue;
      const fileJson = await fileResp.json();
      if (fileJson.encoding === 'base64') {
        const content = Buffer.from(fileJson.content, 'base64').toString('utf-8');
        snippets += `\n--- FILE: ${file.path} ---\n${content.slice(0, 400)}\n`;
      }
    }
    return snippets;
  } catch (_) {
    return '';
  }
}

async function fetchIssues(host: string, owner: string, repo: string, githubToken?: string): Promise<SimpleIssue[]> {
  const protocol = host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https';
  const url = `${protocol}://${host}/api/issues?owner=${owner}&repo=${repo}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Failed to fetch issues: ${resp.status}`);
  }
  const json = await resp.json();
  const issues: SimpleIssue[] = json.issues;
  // fetch first 5 comments for each issue in parallel (but limit concurrency)
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
  if (githubToken) headers.Authorization = `Bearer ${githubToken}`;
  await Promise.all(
    issues.map(async (iss) => {
      try {
        const commentsResp = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues/${iss.number}/comments?per_page=5`, { headers });
        if (!commentsResp.ok) return;
        const commentsJson = await commentsResp.json();
        iss.comments = (commentsJson || []).map((c: any) => ({ user: c.user.login, body: c.body, url: c.html_url }));
      } catch (_) {
        iss.comments = [];
      }
    })
  );
  return issues;
}

import { rateLimit } from '../../lib/rateLimit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Basic same-origin check (except during local dev)
  const origin = req.headers.origin || '';
  if (!origin.includes(req.headers.host || '') && !(req.headers.host || '').startsWith('localhost')) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Rate limiting per IP
  const ip = (req.headers['x-forwarded-for'] as string || '').split(',')[0] || req.socket.remoteAddress || 'unknown';
  const rl = rateLimit(ip);
  if (!rl.allowed) {
    res.setHeader('Retry-After', rl.retryAfter || 3600);
    return res.status(429).json({ error: 'Rate limit exceeded. Try again later.' });
  }

  const { owner, repo } = req.query;
  if (!owner || !repo) {
    return res.status(400).json({ error: 'owner and repo are required' });
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return res.status(500).json({ error: 'Missing OPENAI_API_KEY env var' });
  }

  try {
    const host = req.headers.host as string;
    const githubToken = process.env.GITHUB_TOKEN;
    let repoSnippets = await collectRepoSnippets(owner as string, repo as string, githubToken);
    const MAX_SNIPPET_CHARS = 4000;
    if (repoSnippets.length > MAX_SNIPPET_CHARS) {
      repoSnippets = repoSnippets.slice(0, MAX_SNIPPET_CHARS) + '\n...';
    }
    const rawIssues = await fetchIssues(host, owner as string, repo as string, githubToken);
    // trim issue bodies and comments to keep prompt size in check
    const MAX_ISSUES = 30;
    const MAX_BODY = 400;
    const MAX_COMMENT_BODY = 200;
    const issues = rawIssues.slice(0, MAX_ISSUES).map((iss) => ({
      ...iss,
      body: iss.body?.slice(0, MAX_BODY) || '',
      comments: (iss.comments || []).map((c) => ({
        ...c,
        body: c.body?.slice(0, MAX_COMMENT_BODY) || '',
      })),
    }));

    // Build prompt for ChatGPT
    const prompt = `You are an expert open-source mentor. Analyse the following GitHub issues and provide:
1. A concise project overview.
2. A bullet list of the most important issues (include title and URL).
3. A selection of which issues to start with, if you're a beginner. Explain why the issues are important as well. The issues you list should be
determined to be issues, not simple questions or possible issues.
4. You should be absolutely sure that the issues you list are valid feature requests, not simple questions or possible issues. There should be some level of confidence in your selection.
5. It's fine to not select any issues if you don't think there are any good ones.

Repository key file snippets:\n${repoSnippets}\n\nHere are the issues in JSON format:\n${JSON.stringify(issues, null, 2)}\n`;

    const chatResp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!chatResp.ok) {
      const errJson = await chatResp.json().catch(() => null);
      const errMsg: string = errJson?.error?.message || errJson?.message || '';
      if (/context length|maximum context length|too many tokens/i.test(errMsg)) {
        return res.status(400).json({ error: 'The repository is too large or complex to summarize in a single request. Please try a smaller or simpler repository.' });
      }
      return res.status(chatResp.status).json({ error: `OpenAI API error: ${errMsg || 'Unknown error'}` });
    }

    const chatJson = await chatResp.json();
    const summary = chatJson.choices?.[0]?.message?.content ?? '';

    return res.status(200).json({ summary });
  } catch (e) {
    console.error('Issue summarization failed', e);
    // surface specific OpenAI token-length errors if caught here as well
    if (e instanceof Error && /context length|maximum context length|too many tokens/i.test(e.message)) {
      return res.status(400).json({ error: 'The repository is too large or complex to summarize in a single request.' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
}
