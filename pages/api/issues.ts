import type { NextApiRequest, NextApiResponse } from 'next';

interface GithubIssue {
  id: number;
  html_url: string;
  title: string;
  body: string;
  number: number;
  state: string;
  user: { login: string };
  pull_request?: any;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { owner, repo } = req.query;
  if (!owner || !repo) {
    return res.status(400).json({ error: 'owner and repo are required' });
  }

  const token = process.env.GITHUB_TOKEN;
  // GitHub API returns at most 100 issues per page. Fetch them all.
  const baseUrl = `https://api.github.com/repos/${owner}/${repo}/issues?state=open&per_page=100`;

  const fetchOptions: RequestInit = {
    headers: {
      Accept: 'application/vnd.github+json',
    },
  };
  if (token) {
    // Use bearer token for higher rate limits
    (fetchOptions.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }


  try {
    const allIssues: GithubIssue[] = [];
    let page = 1;
    while (page <= 10) {
      const pagedUrl = `${baseUrl}&page=${page}`;
      const response = await fetch(pagedUrl, fetchOptions);
      if (!response.ok) {
        return res.status(response.status).json({ error: `GitHub API error: ${response.status}` });
      }
      const batch: GithubIssue[] = await response.json();
      allIssues.push(...batch);
      if (batch.length < 100) {
        break; // last page reached
      }
      page += 1;
    }
    // keep only true issues (no pull_request field) that are open
    const clean = allIssues.filter(i => i.state === 'open' && !(i as any).pull_request);
    // Return minimal fields to the client
    const mapped = clean.map((i) => ({
      id: i.id,
      url: i.html_url,
      title: i.title,
      body: i.body,
      number: i.number,
      user: i.user.login,
    }));
    return res.status(200).json({ issues: mapped });
  } catch (e) {
    console.error('Fetching issues failed', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
