/**
 * Heuristic pattern matchers that classify a scraped DOM section against the EDS block
 * library (docs/04-block-library.md). Each rule's `extract` returns
 * { blockId, confidence, rows } where `rows` is the table-row representation EDS authoring
 * uses: row 0 is the block name, subsequent rows are the block's content cells — the exact
 * shape each block's decorate() function expects (see blocks/<name>/<name>.js).
 *
 * These are heuristics, not a guarantee. classify.js records a confidence score and the
 * report flags anything below MIN_CONFIDENCE for manual review rather than silently
 * guessing — see docs/15-migration-utilities.md's parity-check step.
 *
 * Every test/extract receives (el, $, ctx): `el` is a raw cheerio element, `$` is the loaded
 * cheerio instance for the current page (so nested queries use $(el).find(...) consistently),
 * and `ctx` carries { baseUrl, index }.
 */

const FILE_EXT_RE = /\.(pdf|docx?|xlsx?|pptx?|zip)$/i;
const SOCIAL_DOMAINS = ['linkedin.com', 'twitter.com', 'x.com', 'facebook.com', 'instagram.com'];

function text($el) {
  return $el.text().replace(/\s+/g, ' ').trim();
}

function imageCell($el, $, baseUrl) {
  const img = $el.is('img') ? $el : $el.find('img').first();
  if (!img.length) return '';
  const src = img.attr('src') || img.attr('data-src') || '';
  const abs = src ? new URL(src, baseUrl).toString() : '';
  const alt = img.attr('alt') || '';
  return abs ? `[image] ${abs} (alt: "${alt}")` : '';
}

function firstLink($el, $, baseUrl) {
  const a = $el.is('a') ? $el : $el.find('a').first();
  if (!a.length) return null;
  return { href: new URL(a.attr('href') || '', baseUrl).toString(), text: text(a) };
}

function safeUrl(href, baseUrl) {
  try { return new URL(href || '', baseUrl).toString(); } catch { return href || ''; }
}

// ---- self-identifying widgets (matched anywhere in the content root, any nesting depth) ----

export const widgetRules = [
  {
    blockId: 'carousel',
    test: (el, $) => {
      const $el = $(el);
      return /carousel|slider|swiper/i.test($el.attr('class') || $el.attr('id') || '') && $el.find('img').length >= 2;
    },
    extract: (el, $, ctx) => {
      const $el = $(el);
      // NOTE: cheerio's .map(cb).get() flattens array return values one level (jQuery
      // behavior) — use .toArray().map() with a native array map whenever each item
      // needs to stay a distinct [a, b] row pair.
      const rows = $el.find('img').toArray().map((img) => {
        const $img = $(img);
        return [imageCell($img, $, ctx.baseUrl), $img.attr('alt') || ''];
      });
      return { blockId: 'carousel', confidence: 0.7, rows: [['Carousel'], ...rows] };
    },
  },
  {
    blockId: 'tabs',
    test: (el, $) => {
      const $el = $(el);
      return $el.attr('role') === 'tablist' || /(^|\s)tabs(\s|$)/i.test($el.attr('class') || '');
    },
    extract: (el, $) => {
      const $el = $(el);
      const tabLabels = $el.find('[role="tab"], .tab, .tab-label').map((_, t) => text($(t))).get();
      const panelHost = $el.attr('role') === 'tablist' ? $el.parent() : $el;
      const panels = panelHost.find('[role="tabpanel"], .tab-panel, .tab-content').map((_, p) => text($(p))).get();
      const rows = tabLabels.map((label, i) => [label, panels[i] || '']);
      return { blockId: 'tabs', confidence: rows.length ? 0.65 : 0.3, rows: [['Tabs'], ...rows] };
    },
  },
  {
    blockId: 'accordion',
    test: (el, $) => {
      const $el = $(el);
      return $el.find('details').length >= 2 || /accordion|faq/i.test($el.attr('class') || $el.attr('id') || '');
    },
    extract: (el, $) => {
      const $el = $(el);
      let rows = [];
      if ($el.find('details').length) {
        rows = $el.find('details').toArray().map((d) => {
          const $d = $(d);
          const summary = $d.find('summary').first();
          const rest = $d.clone();
          rest.find('summary').remove();
          return [text(summary), text(rest)];
        });
      } else {
        rows = $el.find('.faq-item, .accordion-item').toArray().map((item) => {
          const $item = $(item);
          const q = $item.find('h2,h3,h4,.question,.faq-question').first();
          const a = $item.clone();
          if (q.length) a.find(q.get(0).tagName).first().remove();
          return [text(q), text(a)];
        });
      }
      return { blockId: 'accordion', confidence: rows.length >= 2 ? 0.75 : 0.35, rows: [['Accordion'], ...rows] };
    },
  },
  {
    blockId: 'breadcrumb',
    test: (el, $) => {
      const $el = $(el);
      return (($el.attr('aria-label') || '').toLowerCase().includes('breadcrumb')) || /breadcrumb/i.test($el.attr('class') || '');
    },
    extract: (el, $, ctx) => {
      const $el = $(el);
      const crumbs = $el.find('a').map((_, a) => `${text($(a))} (${safeUrl($(a).attr('href'), ctx.baseUrl)})`).get();
      return { blockId: 'breadcrumb', confidence: 0.8, rows: [['Breadcrumb'], [crumbs.join(' > ')]] };
    },
  },
  {
    blockId: 'form',
    test: (el, $) => $(el).is('form'),
    extract: (el, $) => {
      const $el = $(el);
      const rows = $el.find('input, textarea, select, button').toArray().map((f) => {
        const $f = $(f);
        const tag = f.tagName.toLowerCase();
        const type = tag === 'select' ? 'select'
          : tag === 'textarea' ? 'textarea'
          : (tag === 'button' || $f.attr('type') === 'submit') ? 'submit'
          : ($f.attr('type') || 'text');
        const label = ($f.attr('id') && $(`label[for="${$f.attr('id')}"]`).text().trim())
          || $f.attr('placeholder') || $f.attr('name') || '';
        return [label, type, $f.attr('name') || '', $f.attr('placeholder') || '', $f.attr('required') !== undefined ? 'true' : 'false'];
      });
      return {
        blockId: 'form',
        confidence: 0.7,
        rows: [['Form'], ...rows],
        note: "Set the block's data-endpoint manually after import (docs/14 — never infer a submission endpoint from scraped markup).",
      };
    },
  },
  {
    blockId: 'share',
    test: (el, $) => {
      const $el = $(el);
      if (!/share|social/i.test($el.attr('class') || '')) return false;
      return $el.find('a').filter((_, a) => SOCIAL_DOMAINS.some((d) => ($(a).attr('href') || '').includes(d))).length >= 1;
    },
    extract: () => ({ blockId: 'share', confidence: 0.6, rows: [['Share'], ['linkedin, x, facebook, email, copy']] }),
  },
  {
    blockId: 'progress-bar',
    test: (el, $) => {
      const $el = $(el);
      return $el.attr('role') === 'progressbar' || /progress-?bar/i.test($el.attr('class') || '');
    },
    extract: (el, $) => {
      const $el = $(el);
      const value = $el.attr('aria-valuenow') || $el.attr('data-value') || '0';
      return { blockId: 'progress-bar', confidence: 0.6, rows: [['Progress Bar'], [value], [text($el)]] };
    },
  },
  {
    blockId: 'embed',
    test: (el, $) => $(el).is('iframe') && /youtube|vimeo/i.test($(el).attr('src') || ''),
    extract: (el, $) => ({ blockId: 'embed', confidence: 0.85, rows: [['Embed'], [$(el).attr('src')]] }),
  },
  {
    blockId: 'separator',
    test: (el, $) => $(el).is('hr'),
    extract: () => ({ blockId: 'separator', confidence: 0.95, rows: [['Separator']] }),
  },
];

// ---- top-level content section matchers (direct children of <main>, in document order) ----

export const sectionRules = [
  {
    blockId: 'hero',
    test: (el, $, ctx) => {
      const $el = $(el);
      return ctx.index <= 1 && $el.find('img,picture').length >= 1 && $el.find('h1').length >= 1;
    },
    extract: (el, $, ctx) => {
      const $el = $(el);
      const heading = $el.find('h1').first();
      const body = $el.clone();
      body.find('h1, img, picture').remove();
      return {
        blockId: 'hero',
        confidence: 0.8,
        rows: [['Hero'], [imageCell($el, $, ctx.baseUrl)], [`${text(heading)}\n\n${text(body)}`.trim()]],
      };
    },
  },
  {
    blockId: 'download',
    test: (el, $) => $(el).is('a') && FILE_EXT_RE.test($(el).attr('href') || ''),
    extract: (el, $, ctx) => ({
      blockId: 'download',
      confidence: 0.75,
      rows: [['Download'], [safeUrl($(el).attr('href'), ctx.baseUrl)]],
    }),
  },
  {
    blockId: 'cards',
    test: (el, $) => {
      const $el = $(el);
      const children = $el.children();
      if (children.length < 3) return false;
      const withImgAndHeading = children.filter((_, c) => $(c).find('img').length && $(c).find('h1,h2,h3,h4,h5,h6').length);
      return withImgAndHeading.length >= Math.ceil(children.length * 0.6);
    },
    extract: (el, $, ctx) => {
      const $el = $(el);
      const rows = $el.children().toArray().map((c) => {
        const $c = $(c);
        const heading = $c.find('h1,h2,h3,h4,h5,h6').first();
        const link = firstLink($c, $, ctx.baseUrl);
        return [imageCell($c, $, ctx.baseUrl), [text(heading), link ? `[${link.text}](${link.href})` : ''].filter(Boolean).join('\n')];
      });
      return { blockId: 'cards', confidence: 0.65, rows: [['Cards'], ...rows] };
    },
  },
  {
    blockId: 'teaser',
    test: (el, $) => {
      const $el = $(el);
      return $el.find('img,picture').length === 1 && $el.find('h1,h2,h3').length === 1 && $el.find('a').length >= 1;
    },
    extract: (el, $, ctx) => {
      const $el = $(el);
      const heading = $el.find('h1,h2,h3').first();
      const link = firstLink($el, $, ctx.baseUrl);
      const body = $el.clone();
      body.find('h1,h2,h3,img,picture').remove();
      return {
        blockId: 'teaser',
        confidence: 0.55,
        rows: [['Teaser'], [imageCell($el, $, ctx.baseUrl)], [text(heading)], [text(body)], [link ? `[${link.text}](${link.href})` : '']],
      };
    },
  },
  {
    blockId: 'list',
    test: (el, $) => {
      const $el = $(el);
      if (!$el.is('ul,ol')) return false;
      const items = $el.children('li');
      if (items.length < 4) return false;
      const linkOnly = items.filter((_, li) => $(li).find('img').length === 0 && $(li).find('a').length === 1);
      return linkOnly.length === items.length;
    },
    extract: (el, $, ctx) => {
      const $el = $(el);
      const items = $el.find('a').map((_, a) => `${text($(a))} -> ${safeUrl($(a).attr('href'), ctx.baseUrl)}`).get().join('; ');
      return { blockId: 'list', confidence: 0.5, rows: [['List'], ['source', 'static'], ['items', items]] };
    },
  },
  {
    blockId: 'image',
    test: (el, $) => {
      const $el = $(el);
      return ($el.is('figure') || $el.is('picture')) && !$el.parents('a').length;
    },
    extract: (el, $, ctx) => {
      const $el = $(el);
      const caption = $el.find('figcaption');
      return { blockId: 'image', confidence: 0.7, rows: [['Image'], [imageCell($el, $, ctx.baseUrl)], [text(caption)]] };
    },
  },
  {
    blockId: 'button',
    test: (el, $) => $(el).is('a') && /\b(btn|button|cta)\b/i.test($(el).attr('class') || ''),
    extract: (el, $, ctx) => ({
      blockId: 'button',
      confidence: 0.6,
      rows: [['Button'], [`[${text($(el))}](${safeUrl($(el).attr('href'), ctx.baseUrl)})`]],
    }),
  },
];

export const MIN_CONFIDENCE = 0.5;
