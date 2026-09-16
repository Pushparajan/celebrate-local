# 12 · CI/CD

## Pipeline stages (see `starter/.github/workflows/ci.yml`)

```
lint (eslint + stylelint)
   -> unit tests (@web/test-runner)
   -> build tokens (style-dictionary, if used)
   -> preview deploy (automatic via Helix on push — no explicit deploy step needed)
   -> Lighthouse CI budget gate (doc 10) against preview URL
   -> a11y gate (axe, doc 09) against preview URL
   -> e2e (Playwright, doc 11) against preview URL
   -> [main branch only] publish/promote to live
```

## The EDS-specific wrinkle: deployment is push-triggered, not pipeline-triggered

Helix auto-builds preview on every push to any branch and live on every push/merge to the configured production branch — your CI pipeline's job is **gating merges**, not deploying. Structure branch protection so:
- PRs must pass lint/unit/Lighthouse/a11y/e2e against their auto-generated preview URL before merge.
- Merge to `main` is what triggers live publish — treat that merge as the actual release event, and gate it (required reviews, required checks) accordingly.

## Environments

| Environment | URL pattern | Purpose |
|---|---|---|
| Branch preview | `{branch}--{repo}--{owner}.hlx.page` | Per-PR review, automatic |
| Live | `{branch}--{repo}--{owner}.hlx.live` | Pre-prod / staging equivalent |
| Production | custom domain, CDN in front of `.live` | Public |

## Checklist
- [ ] Branch protection requires all CI gates green before merge to `main`.
- [ ] Preview URLs are the actual target of e2e/Lighthouse/a11y checks (not localhost).
- [ ] Production domain cutover process documented (CDN config, DNS, cert) separately from code deploy — it's a one-time infra step, not part of every release.
- [ ] Rollback procedure documented (revert commit → re-publish) and tested at least once before go-live.
