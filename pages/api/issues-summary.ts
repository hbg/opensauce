import type { NextApiRequest, NextApiResponse } from 'next';

// Minimal structure we care about, matching the mapped object from /api/issues
interface SimpleIssue {
  id: number;
  url: string;
  title: string;
  body: string;
  number: number;
  user: string;
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

async function fetchIssues(host: string, owner: string, repo: string): Promise<SimpleIssue[]> {
  const protocol = host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https';
  const url = `${protocol}://${host}/api/issues?owner=${owner}&repo=${repo}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Failed to fetch issues: ${resp.status}`);
  }
  const json = await resp.json();
  return json.issues as SimpleIssue[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
    const repoSnippets = await collectRepoSnippets(owner as string, repo as string, githubToken);
    const issues = await fetchIssues(host, owner as string, repo as string);

    // Build prompt for ChatGPT
    const prompt = `You are an expert open-source mentor. Analyse the following GitHub issues and provide:
1. A concise project overview.
2. A bullet list of the most important issues (include title and URL).
3. A selection of which issues to start with, if you're a beginner. Explain why the issues are important as well. The issues you list should be
determined to be issues, not simple questions or possible issues.

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
      const errText = await chatResp.text();
      return res.status(chatResp.status).json({ error: `OpenAI API error: ${errText}` });
    }

    const chatJson = await chatResp.json();
    const summary = chatJson.choices?.[0]?.message?.content ?? '';

    return res.status(200).json({ summary });
  } catch (e) {
    console.error('Issue summarization failed', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
