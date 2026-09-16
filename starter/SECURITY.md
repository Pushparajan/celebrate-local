# Security

See docs/14-security-patterns.md in the launchpad for the full framework. Summary:

- CSP is enforced at the CDN layer (Fastly) — see `security/csp-template.txt`.
- No secrets are ever embedded in client-shipped JS under `blocks/` or `scripts/`. Integrations requiring auth go through a serverless proxy function.
- Report a vulnerability: security@example.com
