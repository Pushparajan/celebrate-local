# 11 · Testing Framework

Four layers, matched to the four ways EDS output can break.

## 1. Unit tests — block logic

```js
// test/blocks/hero.test.js
import { expect } from '@esm-bundle/chai';
import decorate from '../../blocks/hero/hero.js';

it('promotes first child to hero-media', async () => {
  document.body.innerHTML = '<div class="hero"><div><picture></picture></div><div><h1>T</h1></div></div>';
  const block = document.querySelector('.hero');
  decorate(block);
  expect(block.querySelector('.hero-media')).to.exist;
});
```
Run via `@web/test-runner` (real browser, not jsdom — EDS blocks manipulate real DOM/CSS interactions worth testing against an actual engine).

## 2. Visual regression — block catalog

Percy/Chromatic (or Playwright's built-in screenshot diffing) snapshots each block's test fixture across breakpoints. Run on every PR that touches `blocks/` or `styles/`.

## 3. E2E — critical user journeys

Playwright against a real preview branch (`{branch}--{repo}--{owner}.hlx.page`) — not a local mock — since EDS's edge behavior (redirects, headers, caching) is part of what needs testing.

```js
// test/e2e/homepage.spec.js
test('homepage LCP block renders eager', async ({ page }) => {
  await page.goto(PREVIEW_URL);
  await expect(page.locator('.hero img')).toBeVisible();
});
```

## 4. Content QA — authoring-side

A lightweight checklist/bot that runs against newly published pages: required metadata present, no broken fragment references, no orphaned images — catches author error, which unit/e2e tests can't.

## Checklist
- [ ] Every block ships a unit test as part of its PR (doc 04 contract).
- [ ] Visual regression baseline established before first production launch.
- [ ] E2E suite runs against real preview URLs in CI, not local fixtures only.
- [ ] Content QA check runs post-publish (webhook or scheduled) and alerts on failures.
