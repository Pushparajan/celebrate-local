import * as cheerio from 'cheerio';
import { readdir, readFile } from 'node:fs/promises';
import { writeJSON } from './utils/fs.js';
import { widgetRules, sectionRules, MIN_CONFIDENCE } from './rules/block-rules.js';

/**
 * Classifies one page's scraped HTML into an ordered list of EDS block sections.
 *
 * Pass 1 (widgets): self-identifying components (carousel, tabs, accordion, breadcrumb,
 * form, share, progress-bar, embed, separator) are matched anywhere in the content root,
 * regardless of nesting — these patterns are structurally unambiguous. Matched elements are
 * "claimed" so pass 2 doesn't also try to classify their contents.
 *
 * Pass 2 (sections): remaining *direct children* of the content root are matched against
 * position/shape-dependent rules (hero, cards, teaser, list, image, button, download) in
 * document order. Anything that matches nothing becomes a plain "text" passthrough section —
 * still migrated (as native content, no block needed) but flagged for the parity-check step.
 */
function classifyHeaderFooter($, tag, blockId, label) {
  const el = $(tag).first();
  if (!el.length) return null;
  const links = el.find('a').map((_, a) => `${$(a).text().trim()} (${$(a).attr('href') || ''})`).get();
  return { blockId, confidence: 0.9, source: tag, rows: [[label], [links.join(' | ')]] };
}

export function classifyPage(html, baseUrl) {
  const $ = cheerio.load(html);
  const root = $('main').first().length ? $('main').first() : $('body');
  const claimed = new Set();
  const sections = [];

  const header = classifyHeaderFooter($, 'header', 'nav', 'Nav (site header)');
  if (header) sections.push(header);

  // Pass 1: widgets, any depth, in document order.
  const widgetMatches = [];
  root.find('*').each((_, el) => {
    if (claimed.has(el)) return;
    for (const rule of widgetRules) {
      if (rule.test(el, $)) {
        widgetMatches.push({ el, rule });
        $(el).find('*').each((__, d) => claimed.add(d));
        claimed.add(el);
        break;
      }
    }
  });
  widgetMatches
    .sort((a, b) => root.find('*').index(a.el) - root.find('*').index(b.el))
    .forEach(({ el, rule }) => {
      const result = rule.extract(el, $, { baseUrl });
      sections.push({ ...result, source: 'widget' });
    });

  // Pass 2: direct children of the content root, in document order, skipping claimed nodes.
  root.children().each((index, el) => {
    if (claimed.has(el)) return;
    // also skip if this child *contains* an already-claimed widget entirely (avoid duplicate wrap)
    const containsOnlyClaimed = $(el).children().length > 0
      && $(el).children().toArray().every((c) => claimed.has(c));
    if (containsOnlyClaimed) return;

    let matched = null;
    for (const rule of sectionRules) {
      if (rule.test(el, $, { baseUrl, index })) { matched = rule; break; }
    }

    if (matched) {
      const result = matched.extract(el, $, { baseUrl, index });
      sections.push({ ...result, source: 'section' });
    } else {
      const $el = $(el);
      const snippet = $el.text().replace(/\s+/g, ' ').trim().slice(0, 140);
      if (snippet) {
        sections.push({
          blockId: null,
          confidence: 1,
          source: 'passthrough',
          rows: null,
          note: 'No block match — migrates as native text/content, no decoration needed.',
          snippet,
          // Retained so `propose-blocks`/`scaffold-blocks` can build a new block from this
          // section after a human decides it deserves one — see docs/15.
          html: $.html(el),
          classes: ($el.attr('class') || '').split(/\s+/).filter(Boolean),
          tag: el.tagName,
        });
      }
    }
  });

  const footer = classifyHeaderFooter($, 'footer', 'nav', 'Nav (site footer)');
  if (footer) sections.push(footer);

  return sections;
}

export async function runClassify({ input, output }) {
  let manifest;
  try {
    manifest = JSON.parse(await readFile(`${input}/scrape-manifest.json`, 'utf-8'));
  } catch {
    // Fallback for fixture/local runs with no crawl+scrape manifest: classify every .html
    // file found directly under `input` using its filename as the page URL.
    const files = (await readdir(input)).filter((f) => f.endsWith('.html'));
    manifest = { pages: files.map((f) => ({ ok: true, slug: f.replace(/\.html$/, ''), rawHtmlPath: f, url: `file://${f}` })) };
  }

  const results = [];
  for (const page of manifest.pages.filter((p) => p.ok)) {
    const html = await readFile(`${input}/${page.rawHtmlPath}`, 'utf-8');
    const sections = classifyPage(html, page.url);
    const unmatched = sections.filter((s) => s.blockId === null).length;
    const lowConfidence = sections.filter((s) => s.blockId && s.confidence < MIN_CONFIDENCE).length;
    console.log(`[classify] ${page.slug}: ${sections.length} sections (${unmatched} passthrough, ${lowConfidence} low-confidence)`);
    results.push({ url: page.url, slug: page.slug, title: page.title, sections });
  }

  await writeJSON(`${output}/classified.json`, { classifiedAt: new Date().toISOString(), pages: results });
  console.log(`\n[classify] done — ${results.length} pages classified -> ${output}/classified.json`);
  return results;
}
