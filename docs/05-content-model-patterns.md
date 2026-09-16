# 05 · Content-Model Patterns

EDS has no database schema — the "content model" is the convention of how authors structure documents (Word/GDoc/da.live) that get converted to blocks and metadata.

## Page-level metadata table (every page)

Authors add a `Metadata` block at the bottom of the doc:

| Metadata | |
|---|---|
| Title | Page title for `<title>` and OG |
| Description | Meta description |
| Image | Social share image |
| Template | e.g. `article`, `landing` — drives `head.html` branching |
| robots | optional, e.g. `noindex` |

`scripts/scripts.js` reads this into `document` head at eager phase (see doc 08, SEO).

## Fragments for reuse

Shared content (footers, legal blurbs, repeated CTAs) lives in dedicated documents referenced via a `fragment` block pointing at a path — avoids copy-paste drift across hundreds of authored pages.

## Structured/list content without a CMS

For data that looks tabular (product specs, event listings), two supported patterns:
1. **Sheet-backed content** — a spreadsheet document exposed via the Query Index (`helix-query.yaml`), fetched client-side or at build. Good for >50 rows, changes independent of page authoring.
2. **In-page block table** — a block whose rows *are* the data (e.g. `table` block). Good for <20 rows tightly coupled to one page.

## Content model documentation format (require this per site)

For each page template, document:
```
Template: Article
Required blocks: Hero, Metadata
Optional blocks: Cards, Accordion, Table, Fragment
Metadata fields: Title, Description, Image, Author, PublishDate, Category
```
Keep these in a `CONTENT-MODEL.md` per site — this is what content authors and the Universal Editor config (doc 06) are both derived from, so it must be the single source of truth, not implicit in block code.

## Checklist
- [ ] `CONTENT-MODEL.md` exists per site and is kept current with block catalog.
- [ ] Fragment strategy defined for footer/nav/repeated CTAs before authors start duplicating content.
- [ ] Sheet vs. in-page-table decision documented per structured-content use case.
- [ ] Required vs. optional metadata fields enforced (a CI content-lint or authoring guardrail, not just convention).
