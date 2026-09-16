# 08 · SEO Framework

## Metadata pipeline

`Metadata` block content (doc 05) → `head.html` template → rendered `<head>`:

```html
<title>{{title}}</title>
<meta name="description" content="{{description}}">
<meta property="og:title" content="{{title}}">
<meta property="og:image" content="{{image}}">
<link rel="canonical" href="{{canonical}}">
```
`scripts/scripts.js` reads `getMetadata('description')` etc. at eager phase and patches these in for anything not resolvable at edge-render time (e.g., computed canonical URLs across environments).

## Structured data

Inject JSON-LD per template type (Article, Product, FAQ, Organization) as a small per-template module loaded at lazy phase, driven off the same metadata fields — don't hand-author JSON-LD per page.

## Sitemap & robots

- `sitemap.xml` generated from the Query Index (`helix-query.yaml`) via a scheduled action or the sitemap plugin — not hand-maintained.
- `robots.txt` checked into the repo root; per-page `noindex` honored from the Metadata table (doc 05).

## Redirects

`redirects.xlsx`/`redirects.json` mapped through `fstab.yaml`-adjacent config, served at the edge — critical for migration (doc 15) SEO-equity preservation. Every migrated URL needs a mapped redirect before cutover, not after.

## Core Web Vitals as an SEO lever

Because EDS's default architecture is already CWV-favorable (edge-rendered HTML, minimal JS on critical path), the main SEO risk is regressions introduced by blocks/3rd-party scripts — tie this doc to doc 10's budgets rather than treating SEO and performance as separate workstreams.

## Checklist
- [ ] Every template type has a metadata → head mapping and, where relevant, a structured-data module.
- [ ] Sitemap is generated, not hand-maintained, and matches the Query Index.
- [ ] Redirect map validated against 100% of migrated legacy URLs before go-live (doc 15).
- [ ] Canonical URLs correct across preview/live/prod domains (common source of duplicate-content issues).
