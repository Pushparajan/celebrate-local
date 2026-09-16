# 10 · Performance Budgets

EDS's edge-rendering model gives you a strong starting position (typically sub-1s LCP achievable) — the job of this pillar is to keep it there as blocks and 3rd-party scripts accumulate.

## Budgets (enforced in CI, not just monitored)

| Metric | Budget | Gate |
|---|---|---|
| LCP | ≤ 1.5s (mobile, throttled) | Lighthouse CI, fails build if regressed >10% |
| CLS | ≤ 0.05 | Lighthouse CI |
| TBT | ≤ 150ms | Lighthouse CI |
| JS shipped (eager phase) | ≤ 50KB gz | bundlesize check on `scripts/scripts.js` + eager block set |
| CSS (eager phase) | ≤ 30KB gz | bundlesize check |
| 3rd-party requests before delayed phase fires | 0 | network-waterfall assertion in e2e test |

## Enforcement mechanics

```yaml
# .github/workflows/ci.yml (excerpt)
- name: Lighthouse CI budget gate
  run: npx @lhci/cli autorun --config=lighthouserc.json
```
`lighthouserc.json` asserts against the table above; a failing budget blocks merge, it doesn't just warn.

## Where regressions actually come from (design around these)

1. New blocks loading images without `loading="lazy"` / correct `fetchpriority` on non-LCP images.
2. 3rd-party scripts sneaking into eager/lazy phase instead of delayed (doc 07).
3. Web fonts blocking render — use `font-display: swap` and preload only the LCP-critical weight.
4. Unbounded CSS growth as the block library expands — audit `styles/styles.css` size on a schedule, not just at launch.

## Checklist
- [ ] `lighthouserc.json` budgets match the table above (or a documented, deliberately different set).
- [ ] Bundlesize checks wired into CI for eager-phase JS/CSS.
- [ ] Image blocks default to lazy + responsive `srcset`; LCP image is the only eager exception.
- [ ] Font loading strategy reviewed (subset, preload, swap).
