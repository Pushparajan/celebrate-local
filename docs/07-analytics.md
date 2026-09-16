# 07 · Analytics Instrumentation

## RUM (Real User Monitoring) — built in, turn it on deliberately

EDS ships a lightweight RUM beacon (`scripts/aem.js` → `sampleRUM`) that reports CWV and custom events to Adobe's collector at effectively zero performance cost (sampled, delayed-phase). This is your baseline signal before any 3rd-party tag loads — wire real user journeys through it first:

```js
// scripts/scripts.js — delayed phase
window.sampleRUM('cta-click', { source: '.hero a' });
```

## Data layer contract

Define a stable data layer object populated at eager/lazy phase so any downstream tag (Adobe Analytics/Launch, GA4, etc.) reads from one place instead of scraping DOM:

```js
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({
  event: 'page-view',
  page: { template: getMetadata('template'), title: document.title },
});
```

## Loading 3rd-party tags — delayed phase only

```js
// scripts/delayed.js — loaded last, after LCP
import('./lib-analytics.js').then((m) => m.init());
```
Never load analytics/tag-manager scripts in the eager phase — it's the single most common cause of EDS sites missing their performance budget (doc 10).

## Consent gating

Gate the delayed-phase import behind consent state; RUM itself is privacy-safe/anonymous by design and does not need to wait on consent.

## Checklist
- [ ] RUM is enabled and dashboarded (doc 13) before any 3rd-party analytics is added.
- [ ] Data layer schema documented and versioned; blocks push to it, don't read from it.
- [ ] All 3rd-party tags confirmed to load in delayed phase only (verify via network waterfall, not just code review).
- [ ] Consent management wraps delayed-phase tag loading.
