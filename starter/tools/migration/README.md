# EDS Migration Toolkit

Crawl a legacy website, scrape its content/styles/code, classify each page's sections
against the [EDS block library](../../blocks/) (docs/04), and generate one `.docx` per
page — ready to drop into your content source (SharePoint/GDrive/da.live) and open in
Universal Editor. This complements `tools/importer/` (the in-browser Helix Import UI
rules-based approach); use this CLI when you want a scriptable, batch, run-from-your-
terminal pipeline instead, or when you want the candidate design tokens / coverage report
this produces along the way.

## Pipeline

```
crawl  ──▶  scrape  ──▶  extract-styles  ──▶  classify  ──▶  propose-blocks  ──▶  scaffold-blocks  ──▶  generate  ──▶  report
 │             │              │                   │              │                    │                    │             │
 finds        fetches        extracts           matches        lists every         (after human          writes        summarizes
 same-        raw HTML,      candidate           each page's    unmatched            review) turns        one .docx     coverage +
 origin       CSS, JS        design tokens        sections      section as a        approved              per page      manual-review
 URLs         asset list     (doc 03)            to a block     candidate new        candidates into                    flags (doc 15)
                                                  (doc 04)       block — nothing      real block code
                                                                 is generated yet     (JS+CSS+test)
```

Each phase writes to (and the next phase reads from) a shared `output/` directory, so you
can stop, inspect, and re-run any single phase without redoing earlier ones.
`propose-blocks`/`scaffold-blocks` are optional — most pages classify entirely against the
existing 25-block library and never need them.

## Quick start

```bash
npm install

# Run everything end to end
node bin/migrate.js all --url https://legacy.example.com --output output/example-com

# Or run phase by phase (useful for large sites / re-runs)
node bin/migrate.js crawl  --url https://legacy.example.com --output output/example-com
node bin/migrate.js scrape --input output/example-com --output output/example-com
node bin/migrate.js extract-styles --input output/example-com --output output/example-com
node bin/migrate.js classify --input output/example-com --output output/example-com
node bin/migrate.js generate --input output/example-com --output output/example-com
node bin/migrate.js report --input output/example-com --output output/example-com
```

Try it against the included fixture first, with no network access required:

```bash
npm run test:fixture
```

This classifies and generates a `.docx` from `fixtures/sample-site/index.html` — a
synthetic page containing one instance of nearly every block pattern (hero, breadcrumb,
FAQ accordion, card grid, download link, testimonial teaser, CTA button, related-links
list, newsletter form) — so you can see real output before pointing this at a live site.

## What each phase actually does

- **crawl** — same-origin only. Seeds from `sitemap.xml` when present (more complete/
  accurate than link-following alone), falls back to BFS link-following, respects
  `robots.txt` `Disallow` rules, and stops at `--max-pages`/`--max-depth`.
- **scrape** — fetches each page's raw HTML, every linked stylesheet (deduped/cached
  across pages), inline `<style>` blocks, and catalogs (but does not execute) every
  `<script src>`. "Code" scraping here means an inventory + raw copy for engineers to
  review — arbitrary legacy JS behavior can't be generically reverse-engineered into a
  block; the block library is what replaces that behavior, mapped by hand where needed.
- **extract-styles** — frequency-ranks hex/rgba colors, `font-family`, and `border-radius`
  values across all scraped CSS into a **candidate** `tokens.candidate.css` — a starting
  point for docs/03's design-system adapter, not a finished token set.
- **classify** — the core step. Runs a two-pass heuristic matcher (`src/rules/block-rules.js`)
  against each page's DOM: self-identifying widgets (carousel, tabs, accordion, breadcrumb,
  form, share, progress-bar, embed, separator) anywhere in the content root, then
  position/shape-dependent patterns (hero, cards, teaser, list, image, button, download)
  across the remaining top-level sections in document order. Every match carries a
  confidence score; nothing below `MIN_CONFIDENCE` (0.5) is treated as settled.
- **generate** — turns classified sections into a real `.docx` using the exact table
  convention EDS authoring expects: a table whose first row is the block name, followed
  by one row per content cell. Scraped images are **not** embedded as binary — the source
  URL + alt text is left as a placeholder cell for the content team to swap in a real
  DAM-managed asset, deliberately, rather than auto-embedding hotlinked/unlicensed/low-res
  scraped images into a production doc.
- **report** — a markdown coverage report: block usage counts, everything flagged
  below-confidence for manual review, and an explicit list of block types this tool
  does **not** attempt to auto-detect (see below) — feed this into docs/15's parity-check
  step before cutover.

## Generating new block code for content that doesn't fit the library (human-gated)

Most legacy pages classify entirely against the existing 25-block library. For content
that doesn't — a bespoke stats counter, a pricing matrix, whatever your site has that
nothing in `blocks/` covers — two more commands turn that gap into real block code,
**with a mandatory human approval step in between**:

```bash
node bin/migrate.js propose-blocks --input output/site --output output/site
# -> writes output/site/block-candidates.json, one entry per unmatched section,
#    every entry starting "approved": false. NOTHING is generated yet.

# Open block-candidates.json. For each section that genuinely needs a new block,
# set "approved": true and optionally rename "name". Leave the rest false — plain
# migrated text is a perfectly valid outcome for most unmatched content.

node bin/migrate.js scaffold-blocks --input output/site --output output/site
# -> for every approved candidate, writes blocks/<name>/<name>.js + .css + a test
#    stub directly into this starter's block library (default --blocks-dir), plus
#    Universal Editor config fragments to merge by hand into component-definition.json
#    / component-models.json, plus classified.scaffolded.json with that section now
#    pointed at the new block.

node bin/migrate.js generate --input output/site --output output/site \
  --classified-file classified.scaffolded.json
# -> regenerates the .docx, now including the new block's table.
```

**What `scaffold-blocks` actually does — and doesn't:**
- *Structural clone*: the section's original scraped markup becomes the block's authored
  content; `decorate()` applies light, generic structuring (tags the first image/heading
  with predictable classes) — not bespoke behavior, since it has no way to know what the
  section is supposed to *do*, only what it looked like.
- *CSS lift*: rules whose selectors reference the section's original classes are pulled
  from the scraped stylesheets and rewritten to be scoped under the new block's class name;
  exact-match colors are swapped for `extract-styles`'s candidate design tokens where found.
- It refuses to overwrite an existing block name (pass `--force` to override deliberately).
- **This is not an AI code generator.** Every generated file is explicitly commented as
  scaffolded and needs the same review any new block gets before merging — see the
  checklist in docs/04-block-library.md. It's meant to save the boilerplate of a new
  block's skeleton, not to guess at behavior a human hasn't specified.

## What this can't (and shouldn't try to) automate

`content-fragment`, `content-fragment-list`, and `fragment` require a content-modeling
decision — what's actually structured/reusable data vs. one-off page content — not a DOM
pattern match, so they're intentionally left for a human (doc 05). `image-compare` and
`language-nav` vary too much across sites for reliable generic pattern-matching. `search`
and `toc` are usually *added* during migration rather than recovered from legacy markup.
The report always lists these explicitly rather than silently skipping them.

## Extending the ruleset

Add a new matcher to `src/rules/block-rules.js` (`widgetRules` for self-identifying
components, `sectionRules` for position-dependent top-level sections) — each is a plain
`{ test, extract }` pair, no framework beyond cheerio. `npm run test:fixture` after any
change is the fastest feedback loop; add a matching pattern to
`fixtures/sample-site/index.html` if you're adding coverage for a new pattern.

## Configuration

No config file is required for a single run — everything is CLI flags (`--help` on any
command). For repeat runs against the same site, keep the `--output` directory around and
re-run only the phase you need (e.g. re-run `classify`+`generate` after tuning a rule,
without re-crawling).
