# FileSmart staging smoke-test checklist

Use a production-like staging deployment with test credentials and non-production service keys. Do not use real taxpayer documents or live payment credentials.

Before recording manual results, run the automated edge check against the staging HTTPS URL:

```powershell
npm run verify:cloudflare -- https://staging.example.com
```

The command must pass all representative public-route checks and must receive an actual `404` for `/__filesmart_404_probe__`. A branded page rendered with HTTP `200` is a failure because it can make unknown routes appear valid to crawlers and monitoring systems.

## Public routes and indexing

- [ ] `/` returns `200`, has one meaningful H1, title, description, canonical, and usable mobile layout.
- [ ] `/learn`, every guide route, `/how-it-works`, `/about`, `/contact`, `/calculator`, and `/filing-directory` return `200` with expected initial HTML.
- [ ] `/privacy`, `/terms`, and `/disclaimer` display the draft/legal status accurately.
- [ ] Unknown routes return the branded `404.html`/not-found page and do not redirect to home.
- [ ] `/robots.txt` and `/sitemap.xml` are reachable and contain only intended public routes.
- [ ] Authenticated routes are not exposed in the public sitemap or initial public HTML.

## Conversion and calculator

- [ ] Public calculator accepts valid income/deduction inputs and displays a 2026 estimate.
- [ ] Calculator never submits a tax return and retains the waitlist/preparation options.
- [ ] Invalid, incomplete, ambiguous, and unsupported inputs produce safe explanatory messages without false numeric estimates.
- [ ] Account creation, email confirmation, login, logout, and reset-password paths work with staging credentials.
- [ ] Pricing/account gate behaves as intended for signed-out and signed-in users.
- [ ] Waitlist and contact forms validate fields, reject honeypot submissions, show safe errors, and use a staging recipient/provider.

## Authenticated preparation

- [ ] Profile and preparation data save and restore after reload.
- [ ] State/jurisdiction selection, tax-year handling, declaration steps, review, and generic preparation save behave correctly.
- [ ] File validation rejects unsupported MIME types, executable extensions, and oversized files; no test file is publicly executable.
- [ ] PDF, CSV, and XLSX exports download successfully and state that they are not submitted.
- [ ] Reminder settings and message workflows respect user ownership and remain email-disabled until the separate delivery setup is validated.

## Security and privacy

- [ ] Browser bundles contain no service-role key, secret, API token, or `.env` value.
- [ ] RLS/user isolation is tested with two staging users.
- [ ] No tax identifiers, financial amounts, or document contents appear in analytics payloads or logs.
- [ ] Authentication failures, network failures, and permission failures show human-readable messages without stack traces.
- [ ] CORS, security headers, cookie flags, and direct-to-origin controls are validated in the deployed staging environment.

## Responsive/accessibility/reliability

- [ ] Test mobile, tablet, desktop, and ultra-wide widths.
- [ ] Complete keyboard-only navigation on public nav, forms, calculator, dialogs, and export controls.
- [ ] Confirm labels, focus states, color contrast, alt text, and loading/status announcements.
- [ ] Test long names/messages, empty arrays, slow network, offline transition, request timeout, and retry paths.

## Evidence to record

Record date, build/deployment ID, browser/device, test account IDs (not passwords), route, result, screenshot/log reference, and owner for every failure.
