import type { NextApiRequest, NextApiResponse } from 'next';

import { rateLimit } from '../../utils/rateLimit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Same-origin protection
  const allowedOrigin = process.env.WEB_ORIGIN;
  const reqOrigin = (req.headers.origin as string) || '';
  if (allowedOrigin && reqOrigin && reqOrigin !== allowedOrigin) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  // Basic per-IP rate limit (30 req/min default)
  if (!rateLimit(req, res)) return;

  const { terms } = req.query; // space-separated search terms
  if (!terms || typeof terms !== 'string') {
    return res.status(400).json({ error: 'terms query param required' });
  }

  const githubToken = process.env.GITHUB_TOKEN;
  const queryTerms = terms.split(/\s+/).filter(Boolean).map(encodeURIComponent).join('+');

  const perPage = 10; // items per GitHub page to align with UI pagination
  const maxPages = 10; // safeguard (max 1 000 results)
  const all: any[] = [];

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
  };
  if (githubToken) headers.Authorization = `Bearer ${githubToken}`;

  try {
    for (let page = 1; page <= maxPages; page++) {
      const url = `https://api.github.com/search/repositories?q=${queryTerms}+in:readme&per_page=${perPage}&page=${page}`;
      const resp = await fetch(url, { headers });
      if (!resp.ok) {
        const text = await resp.text();
        return res.status(resp.status).json({ error: text });
      }
      const json = await resp.json();
      all.push(...json.items);
      if (json.items.length < perPage) break; // last page
    }

    const repos = all.map((r: any) => ({
      id: r.id,
      name: r.full_name,
      url: r.html_url,
      description: r.description,
      stars: r.stargazers_count,
      language: r.language,
    }));

    return res.status(200).json({ repos });
  } catch (e) {
    console.error('GitHub search failed', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
