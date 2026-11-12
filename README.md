# IOF Seva – public website + case portal (one Next.js app, Odoo 19 backend)

| Area | URL | Code |
|---|---|---|
| **Public website** (volunteer registration, support, gallery, events, reports, Elementor-style visual editor) | `/`, `/about`, `/volunteer-registration`, `/support`, `/support/track`, `/editor/login` … | `web/src/app/(public)`, `web/src/public` |
| **Case portal** (staff: cases, assignment, transfers, dashboards, notifications) | `/login`, `/dashboard`, `/cases`, `/analytics` … | `web/src/app/(portal)` |

The two parts use separate layouts and stylesheets, so styles never clash. `/report` redirects to `/support`.

## Odoo modules (`odoo/`)
| Module | Purpose |
|---|---|
| `otm_iof_seva` | Case management: register, assignment, transfer, status rules, finance, timeline, notifications, security, API |
| `iof_volunteer_registration` | Volunteer form backend (approve / reject) |
| `iof_volunteer_card` | Volunteer ID card (PDF + QR) on approval. **Needs your `association_membership` module** (not tested in this build) |
| `iof_site_content` | Edit website texts, events, gallery, reports from Odoo + visual-editor API |
| `iof_support_ticket` | Support requests with SLA and private token tracking |
| `iof_support_case_bridge` | **New:** every website support ticket automatically becomes a case in the portal (national committee, "awaiting assignment") |

Install: `-i otm_iof_seva,iof_volunteer_registration,iof_site_content,iof_support_ticket,iof_support_case_bridge` (+ `association_membership,iof_volunteer_card` for ID cards).
Tests: `--test-tags /otm_iof_seva,/iof_volunteer_registration,/iof_site_content,/iof_support_ticket,/iof_support_case_bridge` (52 tests). Web: `cd web && npm test` (74 tests).

## Run
`cd web && cp .env.example .env.local` (fill values) `&& npm install && npm run dev`. See `docs/OPERATIONS.md`, `docs/DEPLOYMENT_SITE.md`, `docs/UAT_CHECKLIST.md`.

## How the pieces connect
- Visitor submits **/support** → `iof.support.ticket` (token to track) → bridge creates a **case** → Province/National staff assign it in the portal.
- Staff sign in to the visual editor at `/editor/login` with an Odoo user in group *Website Editor*; the portal sidebar has a "Website Editor" link for the President.
- Portal login/BFF uses `ODOO_URL`/`ODOO_DB`; the public site uses the API token. Same Odoo.
- Nginx: forward `Host`, `X-Forwarded-Host`, `X-Real-IP`. Editor session cookie `iof_editor` pages must not be cached.
