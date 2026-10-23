# Test report (sandbox: Odoo 19.0 from odoo/odoo@19.0, Node 22, PostgreSQL)

| Layer | Result |
|---|---|
| Odoo addon install on a fresh DB | clean, no ERROR/WARNING |
| Odoo tests (`--test-enable`) | 15/15 pass: creation, required/invalid input, mass-assignment ignored, sequence, idempotency, workflow, display name/search, ACL (public denied, user cannot delete), HTTP API (401, 201/200 replay, 422 creates nothing, bad JSON/key) |
| Vitest | 35/35 pass: schema, API route (origin/CSRF incl. proxy host, rate limit, allowlist, timeout → safe 503, Odoo 500/401/422 handling, no token leak), form (required errors, inline validation, loading, double-click = 1 request, success only after backend reference, retry keeps values and same key, network error, server field errors) |
| `tsc --noEmit`, `next build` | clean; 10 pages + 2 API routes |
| End-to-end: real Next.js → real Odoo → read back via ORM as staff | 17/17 pass: record found by the visitor's reference, all values match, exactly 1 record, replay creates no duplicate, invalid creates none, cross-origin 403, Odoo down → safe 503 with no leak, Odoo API rejects missing/wrong token, token absent from client bundles |
| Page smoke | all routes 200; old WordPress URLs 308 |

Bugs found and fixed by these tests: omitted optional fields were rejected by the schema; origin check failed behind a reverse proxy (now compares forwarded host).

## Limitations
- Mobile/visual QA was not run in a real browser; do a manual pass on a phone and with keyboard only.
- Rate limiting is in-memory (single Node instance); use Redis if scaled out.
- Site images could not be downloaded in the sandbox (403), so they are hot-linked.
- `hours_per_month` (text) and `date_of_birth` (date) types await confirmation against the original form.
- Confirmation emails, staff notification emails and Odoo activities are not included (Phase 2).
- Collaboration and contact pages use mailto links; no enquiry form was built.
- Privacy Policy and Terms are drafts for IOF review. The old site's placeholder testimonial ("John Doe") and phone "(123) 123 123" were deliberately not reused.
