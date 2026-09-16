# 15 · Migration Utilities

## Two complementary tools

`starter/tools/migration/` is a standalone, scriptable CLI: point it at a live URL and it
crawls, scrapes, classifies against the block library, and generates ready-to-author
`.docx` files end to end — no browser needed, good for batch/CI runs and for producing the
design-token and coverage-report artifacts below. `starter/tools/importer/` (next section)
is the in-browser Helix Import UI rules format — better when you want interactive,
one-page-at-a-time control or need to run inside Adobe's hosted importer tool. Most
programs use the CLI for the bulk of the site and the importer for pages the CLI's
heuristics get wrong.

```bash
cd starter/tools/migration
npm install
npm run test:fixture                                    # try it with no network access
node bin/migrate.js all --url https://legacy.example.com --output output/site
```

See `starter/tools/migration/README.md` for the full phase-by-phase breakdown
(crawl → scrape → extract-styles → classify → generate → report). Two things worth
knowing before you rely on it:
- **Classification is heuristic, not exact.** Every matched section carries a confidence
  score; the generated `report.md` flags anything below threshold, and explicitly lists
  block types (`content-fragment`, `fragment`, `image-compare`, `language-nav`, `search`,
  `toc`) that require a human content-modeling decision rather than a DOM pattern match.
- **Images are never auto-embedded.** Generated `.docx` files carry the scraped image's
  source URL and alt text as a placeholder cell — swapping in the real, rights-cleared,
  DAM-managed asset is a deliberate manual step in review, not an oversight.
- **Content that doesn't fit any existing block can get a new one scaffolded** —
  `propose-blocks` lists every unmatched section as a candidate, a human sets
  `approved: true` on the ones that deserve it, and `scaffold-blocks` generates real
  block JS/CSS/tests from the scraped markup and matching CSS (with design tokens
  substituted in where possible). It's a structural clone + CSS lift, not an AI code
  generator — every file is generated with a review checklist attached, never merged
  automatically. See the toolkit's README for the full `propose-blocks`/`scaffold-blocks`
  workflow.

## The importer

`tools/importer/` hosts import rules run via the Helix Import UI/CLI — a headless-browser-driven transform of legacy pages into EDS block Markdown.

```js
// tools/importer/import.js (excerpt)
export default {
  transformDOM: ({ document }) => {
    const main = document.querySelector('main');
    WebImporter.DOMUtils.remove(main, ['.legacy-nav', '.legacy-footer', 'script']);
    // map legacy .promo-card markup -> EDS "Cards" block table
    createCardsBlock(main, document.querySelectorAll('.promo-card'));
    return main;
  },
  generateDocumentPath: ({ url }) => new URL(url).pathname.replace(/\/$/, ''),
};
```

## Migration workflow

```
1. Inventory: crawl legacy site, catalog URL -> template-type mapping
2. Import rules: one transform per legacy template/component pattern
3. Bulk import: run importer against full URL list -> lands docs in content source
4. Content QA (doc 11): automated check for missing metadata/broken fragments
5. Redirect map (doc 08): legacy URL -> new URL, 100% coverage required before cutover
6. Parity check: automated diff of rendered legacy vs. EDS page (text content, key elements present)
7. Cutover: DNS/CDN switch, monitor 404/error rate (doc 13) closely for 48-72h post-cutover
```

## Parity checking (don't skip this — it's what catches importer edge cases at scale)

A scripted comparison (Playwright) between legacy and migrated pages on: presence of key text blocks, image count, internal link count. Flags pages for manual review rather than assuming the importer got everything right at hundreds/thousands-of-pages scale.

## Checklist
- [ ] Full legacy URL inventory exists and is mapped to a template type before writing import rules.
- [ ] `tools/migration`'s `report.md` reviewed page-by-page; every low-confidence and "not auto-detected" flag resolved by a human before the corresponding `.docx` is uploaded to the content source.
- [ ] Import rules (CLI ruleset or browser importer) cover every legacy component pattern found in the inventory, not just the common ones.
- [ ] Redirect map has 100% coverage of legacy URLs before cutover (doc 08).
- [ ] Automated parity check run against a meaningful sample (or full set, if feasible) before go-live.
- [ ] Post-cutover monitoring window defined with clear rollback criteria.
