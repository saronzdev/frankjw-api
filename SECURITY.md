# Security Policy

## Supported versions

Only the latest version deployed on Vercel (`main`) receives security fixes.

## Reporting a vulnerability

Please report vulnerabilities privately — do not open a public issue.

- Email: ronaldsrd@protonmail.com
- Or use GitHub's "Report a vulnerability" under the **Security** tab of this repository (GitHub Security Advisories).

Include a description of the issue, steps to reproduce it and its impact. You will get a response within a few days.

## Scope

- `api/` — Express API running on Vercel (auth, products, uploads).
- `app/` — Preact SPA / PWA served from Vercel.
- Supabase Storage is used for product images; report any leaked credentials or access-control issues.

All reports are reviewed and fixes are released as soon as feasible before public disclosure.
