# 01 · Reference Architecture

## The request path

```
Author (SharePoint / GDrive / da.live)
        |  (document saved)
        v
Helix Content Bus  --preview-->  admin.hlx.page  -->  {branch}--{repo}--{owner}.hlx.page
        |
        v (publish)
Helix Content Bus  --live---->  admin.hlx.live   -->  {branch}--{repo}--{owner}.hlx.live
        |
        v
Fastly CDN (Edge) --> your custom domain, cached at edge, HTML generated from Markdown
        |
        v
Browser: scripts/aem.js bootstraps -> decorates <main> into sections/blocks -> CSS/JS loaded per block
```

Key properties this launchpad designs around:
- **No origin server for rendering.** Content documents are converted to semantic HTML at the edge; there is no Node/Java render tier to operate — this removes a whole category of infra (autoscaling, patching) but means all interactivity is client-side, progressively enhanced.
- **Three-phase loading** in `scripts/aem.js`: E (eager — LCP block + hero), L (lazy — rest of page), D (delayed — 3rd-party/analytics/chat). Every pillar below (perf, analytics, a11y) hooks into these phases rather than inventing new ones.
- **Content and code are decoupled repos-of-truth**: code lives in GitHub, content lives in the document source. `fstab.yaml` binds them.
- **Preview and live are separate, both CDN-backed**, giving you a real production-fidelity staging environment for free — design your review/approval workflow around it rather than building a separate staging stack.

## Reference topology for an enterprise program

```
github.com/org/eds-core          -> shared blocks, design-system adapter, CI (this starter)
github.com/org/eds-site-brandA   -> imports core (submodule/npm/fork-sync)
github.com/org/eds-site-brandB
github.com/org/eds-tools         -> importer, migration scripts, shared eslint/stylelint config
```

Two supported multi-site strategies — pick one and document the choice:

| Strategy | When |
|---|---|
| **Monorepo, multiple `fstab.yaml` mount points** | Sites share nearly all blocks/design tokens; one team owns them all. |
| **Core package + per-brand repos** (block library as npm/git-submodule dependency) | Multiple teams, different release cadence, brand-specific blocks needed. |

## Checklist
- [ ] Decide content source (SharePoint / GDrive / da.live) — affects auth, Universal Editor config, content-model patterns. See `starter/CONTENT-SOURCES.md` for step-by-step setup of each.
- [ ] Decide single-site vs. multi-site topology above.
- [ ] `fstab.yaml` mount points confirmed with content team.
- [ ] Domain + CDN strategy (own Fastly config vs. default `.live` domain) decided.
