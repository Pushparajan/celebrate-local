# 02 · Production Starter Repository

`starter/` in this launchpad is a superset of Adobe's `helix-project-boilerplate`, pre-wired with the other 13 pillars. Use it by:

```bash
# Option A: new repo
npx degit yourorg/eds-launchpad/starter my-new-site
cd my-new-site && npm install

# Option B: retrofit an existing EDS repo
diff -rq path/to/existing-repo starter/  # see what's missing, merge in piecewise
```

## What's included vs. what you add

| Included | You add |
|---|---|
| `scripts/aem.js` bootstrap, `scripts/scripts.js` app entry | Brand tokens (`styles/styles.css` vars) |
| 3 reference blocks (hero, cards, accordion) with tests | Brand-specific blocks |
| `fstab.yaml`, `helix-query.yaml` templates | Real mount points + index definitions |
| CI workflow (lint, unit test, Lighthouse budget gate) | Deployment secrets / environment config |
| `.eslintrc.json`, `.stylelintrc.json` | Team-specific rule overrides |
| `component-models.json`, `component-definition.json` stubs | Real Universal Editor field definitions per block |
| `SECURITY.md`, CSP header template | Org-specific allowlist entries |

## Repo layout (standard EDS shape — don't deviate without reason)

```
/blocks/<name>/<name>.js       block logic (default export: decorate(block))
/blocks/<name>/<name>.css      block styles, scoped under .name
/styles/styles.css             design tokens as CSS custom properties
/scripts/aem.js                framework runtime (upstream, rarely edited)
/scripts/scripts.js            app bootstrap, phase wiring, delayed.js load
/icons/                        inline SVGs referenced by :icon-name: syntax
/tools/importer/                import rules for migration (doc 15)
/fstab.yaml                     content source mount points
/helix-query.yaml               indices for the query/search API
/head.html                      shared <head> injected per page
```

## Checklist
- [ ] `npm run lint` and `npm run test` pass on a clean clone.
- [ ] `aem up` (CLI) serves the starter locally against a real content source.
- [ ] README in the new repo documents the content source and mount points explicitly (not left to tribal knowledge).
