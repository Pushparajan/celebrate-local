# 03 · Design-System Adapter

Goal: let a brand design system (Figma tokens, an existing DS like Spectrum, Material, or a bespoke one) drive EDS styling **without** a build-time CSS framework, since EDS ships plain CSS to the edge.

## Pattern: tokens → CSS custom properties → blocks consume only tokens

```css
/* styles/styles.css — generated or hand-synced from Figma tokens (Style Dictionary recommended) */
:root {
  --color-brand-primary: #0b5fff;
  --color-brand-primary-contrast: #ffffff;
  --font-family-heading: 'Adobe Clean', system-ui, sans-serif;
  --font-family-body: 'Adobe Clean', system-ui, sans-serif;
  --spacing-xs: 4px; --spacing-s: 8px; --spacing-m: 16px; --spacing-l: 32px; --spacing-xl: 64px;
  --radius-s: 4px; --radius-m: 8px;
  --shadow-card: 0 2px 8px rgb(0 0 0 / 8%);
}
```

Blocks then **only** reference tokens, never hardcode brand values:

```css
/* blocks/cards/cards.css */
.cards > ul > li {
  border-radius: var(--radius-m);
  box-shadow: var(--shadow-card);
  padding: var(--spacing-m);
}
```

## Style Dictionary pipeline (optional but recommended at enterprise scale)

```
design-tokens.json (exported from Figma via Tokens Studio)
        │  style-dictionary build
        ▼
styles/tokens.css   (generated, checked in, never hand-edited)
```

Wire this as a `npm run tokens:build` script and a CI check that fails if `tokens.css` is stale relative to `design-tokens.json`.

## Theming / multi-brand

Use a `data-brand` attribute on `<body>` (set via metadata → `head.html` template) and scope overrides:

```css
body[data-brand="brandb"] { --color-brand-primary: #d0021b; }
```

## Checklist
- [ ] All hardcoded hex/px values in block CSS replaced with token references (lint rule: `stylelint-declaration-strict-value`).
- [ ] Token source of truth identified (Figma / design-tokens.json) and a rebuild path exists.
- [ ] Multi-brand theming strategy decided (attribute-based vs. separate CSS bundle per brand) if applicable.
- [ ] Dark mode, if required, expressed as a token layer, not per-block overrides.
