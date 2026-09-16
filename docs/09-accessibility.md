# 09 · Accessibility Framework

Target: WCAG 2.1 AA across the block library, enforced structurally rather than caught in audits.

## The block a11y contract

Every block in the library (doc 04) must, before merge:
- Be operable via keyboard alone (tab order matches visual order; no keyboard traps).
- Expose correct roles/states for any custom interaction (prefer native elements — `<details>`, `<dialog>`, `<button>` — over ARIA-reimplemented ones).
- Maintain a logical heading hierarchy regardless of where the block is placed on the page (authors control heading level via content, not the block hardcoding `<h2>`).
- Have visible focus indicators that meet contrast requirements against the design-system tokens (doc 03) — check this whenever tokens change, since a token update can silently break focus-ring contrast.
- Respect `prefers-reduced-motion` for any animation.

## Automated gates (CI, doc 12)

- `axe-core` run against each block's test fixture (`test/blocks/*.test.js`) — fails the build on new violations.
- Color-contrast check against the token set (doc 03) whenever `styles/tokens.css` changes.
- Lighthouse a11y category included in the CI budget gate (doc 10).

## Manual review cadence

Automated tools catch roughly a third of WCAG criteria — pair CI gates with:
- Screen reader pass (VoiceOver + NVDA minimum) on each new block before it enters the library.
- Keyboard-only walkthrough of each new page template.

## Authoring-side accessibility

Content authors control things code can't fix: image alt text, meaningful link text, heading levels. Bake required-alt-text into the Universal Editor model (doc 06) rather than relying on author diligence alone.

## Checklist
- [ ] Every block passes automated axe checks in CI.
- [ ] Focus-visible styles verified against current design tokens.
- [ ] Screen-reader pass completed for each block before it's added to the shared catalog.
- [ ] Alt-text field required (not optional) in Universal Editor models for all image fields.
