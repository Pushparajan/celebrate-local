# 13 · Observability

## RUM dashboards (primary signal)

Adobe's RUM data (doc 07) is queryable via the RUM Explorer / can be exported to your own warehouse. Stand up dashboards for:
- CWV distribution (p75 LCP/CLS/INP) by template type and device class.
- Custom events (`sampleRUM('cta-click', ...)`) as funnel/engagement signals.
- 404/error rate by path — surfaces broken redirects or stale links post-migration.

## Synthetic monitoring

Because there's no origin server to health-check, synthetic monitoring targets the actual edge response:
- Scheduled Lighthouse runs against production (not just CI-time) to catch drift from 3rd-party script changes that CI can't see (e.g., a tag manager pushing a new script without a code change).
- Uptime/latency checks against the CDN domain from multiple geos.

## Logs

Helix publishes build/publish logs (`admin.hlx.page` API) — surface failures (broken document syntax, failed image conversion) to the content team's channel, not just an engineering dashboard, since the fix is usually an authoring fix.

## Alerting thresholds (starting point — tune per program)

| Signal | Alert when |
|---|---|
| p75 LCP | > budget (doc 10) for 3 consecutive samples |
| Publish failure rate | > 2% over 1hr |
| 404 rate | spike > 3x baseline |
| RUM data gap | no beacons received for > 30min (indicates client-side breakage) |

## Checklist
- [ ] RUM dashboard live and shared with content + engineering, not engineering-only.
- [ ] Synthetic Lighthouse scheduled against production, independent of CI.
- [ ] Publish-failure alerting routes to whoever can act on it (often the authoring team, not on-call eng).
- [ ] Alert thresholds reviewed after first month of real traffic (initial values are starting points, not final).
