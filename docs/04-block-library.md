# 04 · Core Enterprise Block Library

## The block contract

Every block is a folder `blocks/<name>/` with `<name>.js` exporting a default `decorate(block)` function that mutates the block's DOM in place, plus `<name>.css` scoped under `.<name>`.

```js
// blocks/hero/hero.js
export default function decorate(block) {
  const [pic, text] = [...block.children];
  pic.classList.add('hero-media');
  text.classList.add('hero-text');
  block.append(pic, text);
}
```

Non-negotiable rules for every block in the enterprise library:
1. **No layout assumptions about parent.** A block must render correctly nested in any section.
2. **Progressive enhancement.** The unstyled/undecorated HTML must still be readable content (doc 09).
3. **No blocking network calls in `decorate()`** on the eager path — use `scripts/scripts.js` phase hooks for anything async. (A few blocks below — `list`, `search`, `content-fragment*`, `fragment` — do fetch, and are documented as lazy-phase-only for that reason.)
4. **Every block ships a test** (`test/blocks/<name>.test.js`, see doc 11) and a Universal Editor model (doc 06).

## AEM Core WCM Components → EDS block mapping

`starter/blocks/` ships one EDS block per [Adobe Core WCM Component](https://github.com/adobe/aem-core-wcm-components), so a team migrating from classic/CS AEM has a like-for-like starting point rather than a gap analysis to do from scratch.

| AEM Core Component | EDS block | Notes |
|---|---|---|
| Title | `title` | Optional eyebrow + configurable heading level |
| Text | *(none — native)* | Plain authored rich text needs no block/decoration |
| Image | `image` | Captioned/aligned image; plain inline images need no block |
| Image Comparison Slider | `image-compare` | Native `<input type=range>`, no drag library |
| Button | `button` | Style variant via `strong`/`em` wrap convention (matches EDS link-styling norm) |
| Teaser | `teaser` | Image + title + description + CTA |
| List | `list` | Sources: query-index (default), children, static |
| Container / Layout Container | *(sections)* | EDS sections **are** the container primitive — no block needed |
| Tabs | `tabs` | Full ARIA tabs pattern, roving tabindex |
| Accordion | `accordion` | Native `<details>/<summary>` — zero custom ARIA |
| Carousel | `carousel` | Scroll-snap based, no dependency, respects `prefers-reduced-motion` |
| Breadcrumb | `breadcrumb` | Auto-builds from URL path, or authored override |
| Navigation | `nav` | For in-content/secondary nav; global nav still comes from `loadHeader` |
| Language Navigation | `language-nav` | Renders as a `<select>`, no framework dependency |
| Separator | `separator` | Styled `<hr>` |
| Download | `download` | Resolves file size via best-effort `HEAD` request |
| Embed | `embed` | YouTube/Vimeo URL parsing + facade pattern (loads iframe on click/visibility, doc 10) |
| Content Fragment | `content-fragment` | Fetches structured data from a configured GraphQL/JSON endpoint — see doc below |
| Content Fragment List | `content-fragment-list` | Same pattern, renders an array |
| Experience Fragment | `fragment` | Fetches another authored doc's `.plain.html` and re-runs the decoration pipeline on it |
| Progress Bar | `progress-bar` | `role="progressbar"`, animated fill |
| Quick Search / Sites Search | `search` | Client-side filters `/query-index.json`; swap for a real search service at scale |
| Social Media Sharing | `share` | LinkedIn/X/Facebook/email/copy-link, no SDK loaded |
| Form Container / Text / Options / Button / Hidden | `form` | One composite block reads a field-definition table — see below |
| Table of Contents | `toc` | Scans in-page headings, builds anchors |
| Page | *(N/A)* | Handled by EDS's page template system, not a block |
| PDF Viewer | *(not included)* | Niche; recommend an `embed`-style iframe to a hosted viewer if needed |

Plus two EDS-native composites with no direct 1:1 Core Component analog, included because they're near-universal in practice: `hero` (LCP-optimized image+heading, the de facto "above the fold" block on most EDS sites) and `cards` (a variant of Teaser List / List rendered as a grid).

## Two multi-field patterns worth calling out

**`form`** deliberately consolidates AEM's five separate Form components (Container, Text, Options, Button, Hidden) into one block driven by an authored table (`Label | Type | Name | Options | Required`), because EDS authors work in one document per page rather than assembling components field-by-field in a dialog tree. This is the idiomatic EDS shape — prefer it over trying to recreate five separate blocks.

**`content-fragment` / `content-fragment-list`** are the one place this library can't be a drop-in equivalent: EDS has no native structured-content repository like AEM's Content Fragment Model. These blocks fetch from a configurable endpoint (an AEM GraphQL persisted query if you're running headless AEM alongside EDS, or a spreadsheet exposed through `helix-query.yaml`) — pick the source per doc 05's sheet-vs-table guidance and set `endpoint` accordingly in the Universal Editor model.

## Governance

- New blocks go through a design + a11y review before merge (see the `design-system` and `accessibility-review` plugin skills if enabled for your org).
- Block variants are expressed as extra classes on the block wrapper (e.g. `cards (large)`), never as new block folders, to avoid catalog sprawl.
- Deprecation: mark in `component-definition.json` with a `deprecated: true` flag; keep rendering for 2 release cycles minimum so already-authored content doesn't break.

## Checklist
- [ ] Each block has JS, CSS, and a Universal Editor model; representative blocks have tests (extend coverage to the full set as your team's capacity allows — `hero`, `accordion`, `tabs`, `button` are done as the pattern to replicate).
- [ ] No block reaches into another block's DOM or CSS namespace.
- [ ] `content-fragment*` endpoints reviewed for the security implications of client-side fetch (doc 14 — no secrets in the URL/query params).
- [ ] Variant naming convention documented and enforced by lint/review.
