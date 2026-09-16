import * as cheerio from 'cheerio';
import pLimit from 'p-limit';
import { fetchText } from './utils/http.js';
import { writeJSON, writeText, slugify } from './utils/fs.js';

/**
 * Scrapes content, styles, and a catalog of code assets for each crawled page.
 *
 * "Code" here means an inventory + raw copy of CSS/JS assets for engineers to review —
 * arbitrary legacy JS behavior can't be generically transpiled into EDS blocks, so the
 * goal is visibility (what did this page depend on?) rather than automatic translation.
 * The block library (docs/04) is what actually replaces that behavior once mapped by hand
 * for anything classify.js flags as "needs review".
 */
export async function scrapePage(url, { cssCache }) {
  const { ok, text: html, status } = await fetchText(url);
  if (!ok) return { url, status, ok: false };

  const $ = cheerio.load(html);

  const cssHrefs = $('link[rel="stylesheet"]').map((_, el) => $(el).attr('href')).get()
    .filter(Boolean)
    .map((href) => new URL(href, url).toString());

  const inlineStyles = $('style').map((_, el) => $(el).html()).get().join('\n\n');

  const scriptSrcs = $('script[src]').map((_, el) => $(el).attr('src')).get()
    .filter(Boolean)
    .map((src) => new URL(src, url).toString());
  const inlineScriptCount = $('script:not([src])').length;

  // Fetch each unique stylesheet once across the whole scrape, not once per page.
  await Promise.all(cssHrefs.map(async (href) => {
    if (cssCache.has(href)) return;
    const res = await fetchText(href);
    cssCache.set(href, res.ok ? res.text : '');
  }));

  return {
    url,
    status,
    ok: true,
    title: $('title').first().text().trim() || null,
    metaDescription: $('meta[name="description"]').attr('content') || null,
    cssHrefs,
    hasInlineStyles: inlineStyles.trim().length > 0,
    scriptSrcs,
    inlineScriptCount,
    html,
    inlineStyles,
  };
}

export async function runScrape({ input, output, concurrency = 5 }) {
  const { readJSON } = await import('./utils/fs.js');
  const { pages } = await readJSON(`${input}/sitemap.json`);

  const cssCache = new Map();
  const limit = pLimit(concurrency);
  const manifest = [];

  await Promise.all(pages.map((p) => limit(async () => {
    const result = await scrapePage(p.url, { cssCache });
    if (!result.ok) {
      console.warn(`[scrape] failed ${p.url} (status ${result.status})`);
      manifest.push({ url: p.url, ok: false, status: result.status });
      return;
    }
    const slug = slugify(new URL(p.url).pathname);
    await writeText(`${output}/raw/${slug}.html`, result.html);
    if (result.inlineStyles) await writeText(`${output}/assets/css/inline__${slug}.css`, result.inlineStyles);

    manifest.push({
      url: p.url,
      ok: true,
      slug,
      title: result.title,
      metaDescription: result.metaDescription,
      cssHrefs: result.cssHrefs,
      scriptSrcs: result.scriptSrcs,
      inlineScriptCount: result.inlineScriptCount,
      rawHtmlPath: `raw/${slug}.html`,
    });
    console.log(`[scrape] ${p.url} -> raw/${slug}.html`);
  })));

  // Persist every unique external stylesheet fetched during this run.
  await Promise.all([...cssCache.entries()].map(async ([href, content], i) => {
    const slug = slugify(new URL(href).pathname) || `sheet-${i}`;
    await writeText(`${output}/assets/css/${slug}.css`, content);
  }));

  await writeJSON(`${output}/scrape-manifest.json`, { scrapedAt: new Date().toISOString(), pages: manifest });
  console.log(`\n[scrape] done — ${manifest.filter((m) => m.ok).length}/${pages.length} pages scraped`);
  return manifest;
}
