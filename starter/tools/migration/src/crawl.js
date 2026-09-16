import * as cheerio from 'cheerio';
import { fetchText } from './utils/http.js';
import { writeJSON } from './utils/fs.js';

/** Very small robots.txt parser: just enough to respect Disallow for our UA / '*'. */
function parseRobots(text) {
  const rules = [];
  let applies = false;
  text.split('\n').forEach((line) => {
    const [rawKey, ...rest] = line.split(':');
    const key = rawKey?.trim().toLowerCase();
    const value = rest.join(':').trim();
    if (key === 'user-agent') applies = value === '*' || value.toLowerCase().includes('eds-migration');
    if (key === 'disallow' && applies && value) rules.push(value);
  });
  return rules;
}

function isDisallowed(pathname, disallowRules) {
  return disallowRules.some((rule) => rule && pathname.startsWith(rule));
}

async function seedFromSitemap(origin) {
  const { ok, text } = await fetchText(`${origin}/sitemap.xml`);
  if (!ok) return [];
  const matches = [...text.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)];
  return matches.map((m) => m[1]);
}

function extractLinks($, pageUrl, origin) {
  const links = new Set();
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return;
    try {
      const abs = new URL(href, pageUrl);
      abs.hash = '';
      if (abs.origin !== origin) return; // same-origin only — cross-site links aren't "our" pages to migrate
      if (/\.(pdf|jpg|jpeg|png|svg|gif|zip|docx?|xlsx?|mp4|webm)$/i.test(abs.pathname)) return; // assets, not pages
      links.add(abs.toString());
    } catch { /* ignore malformed hrefs */ }
  });
  return [...links];
}

/**
 * BFS-crawl a site starting from `startUrl`, same-origin only, respecting robots.txt
 * and page/depth budgets. Prefers a sitemap.xml as the seed list when present since
 * it's usually more complete and accurate than link-following alone.
 */
export async function crawl({
  startUrl, maxPages = 200, maxDepth = 4, respectRobots = true, onProgress = () => {},
}) {
  const origin = new URL(startUrl).origin;

  let disallowRules = [];
  if (respectRobots) {
    const { ok, text } = await fetchText(`${origin}/robots.txt`);
    if (ok) disallowRules = parseRobots(text);
  }

  const sitemapUrls = await seedFromSitemap(origin);
  const queue = [{ url: startUrl, depth: 0 }, ...sitemapUrls.map((url) => ({ url, depth: 0 }))];
  const visited = new Map(); // url -> { depth, title }

  while (queue.length && visited.size < maxPages) {
    const { url, depth } = queue.shift();
    if (visited.has(url) || depth > maxDepth) continue;

    const pathname = new URL(url).pathname;
    if (isDisallowed(pathname, disallowRules)) continue;

    const { ok, text, status } = await fetchText(url);
    onProgress({ url, status, visited: visited.size, queued: queue.length });
    if (!ok) continue;

    const $ = cheerio.load(text);
    visited.set(url, { depth, title: $('title').first().text().trim() || null });

    if (depth < maxDepth) {
      extractLinks($, url, origin)
        .filter((link) => !visited.has(link))
        .forEach((link) => queue.push({ url: link, depth: depth + 1 }));
    }
  }

  return [...visited.entries()].map(([url, meta]) => ({ url, ...meta }));
}

export async function runCrawl({ url, output, maxPages, maxDepth, respectRobots }) {
  const pages = await crawl({
    startUrl: url,
    maxPages,
    maxDepth,
    respectRobots,
    onProgress: ({ url: u, status, visited, queued }) => {
      console.log(`[crawl] (${visited} found, ${queued} queued) ${status || 'ERR'} ${u}`);
    },
  });
  await writeJSON(`${output}/sitemap.json`, { source: url, crawledAt: new Date().toISOString(), pages });
  console.log(`\n[crawl] done — ${pages.length} pages written to ${output}/sitemap.json`);
  return pages;
}
