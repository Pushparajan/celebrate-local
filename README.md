# EDS Launchpad

A batteries-included starting point for **Adobe Edge Delivery Services (EDS / Franklin)** implementations — the reference material engineering, design, and platform teams need to stand up a new EDS program without re-deriving it project by project.

```
EDS Launchpad
│
├── docs/01-reference-architecture.md      System shape, request path, content sources
├── docs/02-starter-repository.md          How to use starter/ as your repo seed
├── docs/03-design-system-adapter.md       Tokens → CSS custom properties → blocks
├── docs/04-block-library.md               Enterprise block catalog & contract
├── docs/05-content-model-patterns.md      Authoring model, metadata, fragments
├── docs/06-universal-editor.md            component-models.json, filters, previews
├── docs/07-analytics.md                   RUM, data layer, consent
├── docs/08-seo.md                         Metadata, sitemaps, structured data
├── docs/09-accessibility.md               WCAG gates, block a11y contract
├── docs/10-performance-budgets.md         CWV budgets & enforcement
├── docs/11-testing.md                     Unit, visual, e2e, block QA
├── docs/12-cicd.md                        Pipelines, environments, previews
├── docs/13-observability.md               RUM dashboards, alerting, logs
├── docs/14-security-patterns.md           CSP, secrets, review gates
├── docs/15-migration-utilities.md         Importer, redirects, parity checks
│
└── starter/                               Deployable starter repo (helix-project-boilerplate compatible)
    ├── CONTENT-SOURCES.md                  Setup steps for SharePoint, Google Drive, and da.live
    ├── blocks/                             25 blocks — full AEM Core WCM Components equivalent (see docs/04)
    └── tools/
        ├── importer/                       Browser-based (Helix Import UI) single-page rules
        └── migration/                      Scriptable CLI: crawl → scrape → classify → generate .docx (see docs/15)
```

## How to use this

1. Read `docs/01-reference-architecture.md` first — everything else assumes it.
2. Fork/copy `starter/` as the seed for a new repo, or diff it against an existing EDS repo to see what's missing.
3. Each `docs/*.md` is self-contained: problem statement → EDS-specific pattern → concrete config/code → checklist. Treat the checklists as your Definition of Done per pillar.
4. Pillars are ordered roughly in the sequence you'd stand them up for a new program, but 03–15 are mostly independent — pull what you need.

## Assumptions

- Content source is either SharePoint, Google Drive, or **da.live**; patterns note where the choice matters.
- Rendering model: EDS's three-phase (Eager/Lazy/Delayed) loading via `scripts/aem.js` (formerly `lib-franklin.js`).
- Authoring: block-based sections/blocks decorated client-side, edited via **Universal Editor**.
