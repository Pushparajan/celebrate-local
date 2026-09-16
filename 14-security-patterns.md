# 14 · Security Patterns

## Content Security Policy

EDS's minimal-JS-by-default posture makes a strict CSP realistic — don't skip it because "it's just a content site."

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' https://your-approved-tag-manager.example;
  style-src 'self' 'unsafe-inline';   /* block CSS is inlined per-block; tighten with nonces if feasible */
  img-src 'self' https: data:;
  connect-src 'self' https://your-rum-endpoint.example;
  frame-ancestors 'none';
```
Set via `head.html` meta tag or, preferably, at the CDN/Fastly layer so it can't be bypassed by a compromised content edit.

## Secrets

No server runtime means no server-side secret store for rendering — but forms/integrations (a `form` block posting to a backend, doc 04) still need auth. Pattern: block calls a thin serverless function (Adobe I/O Runtime, Cloudflare Worker, etc.) that holds the secret; **never** embed API keys in block JS shipped to the browser.

## Authoring access control

Content-source permissions (SharePoint/GDrive/da.live ACLs) *are* your CMS access control — review them with the same rigor as an IAM policy, since anyone with edit access can publish directly to production-adjacent preview and, on merge/publish, to live.

## Supply chain

- Pin dependency versions in `package.json`; `npm audit` in CI (doc 12).
- 3rd-party scripts loaded in delayed phase (doc 07) are still a supply-chain risk — maintain an explicit allowlist, reviewed on change, not "add whatever marketing asks for."

## Checklist
- [ ] CSP enforced at CDN layer, tested against every block/3rd-party script in use.
- [ ] No secrets/API keys present in any client-shipped JS (grep `blocks/` and `scripts/` in CI).
- [ ] Content-source ACLs reviewed and documented as the effective access-control boundary.
- [ ] `npm audit` (or equivalent) gated in CI with a defined severity threshold.
