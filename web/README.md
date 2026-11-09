# IOF Seva – Enterprise Case Management Portal (frontend prototype)

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4 · Radix primitives (shadcn-style) · Lucide · Recharts · Zustand

```bash
npm install
npm run dev      # http://localhost:3000  → login page
npm run build && npm start
```

Login: pick a demo role on the login page (President, Province Head, Coordinator, Case Handler) or use
`president@iof.demo`, `head.ep@iof.demo`, `mukesh@iof.demo`, `anil@iof.demo` + any password. Switch role any time from the header profile menu.
Data lives in browser localStorage (Settings → Reset demo data).

## Structure
- `src/lib/reference-data.ts` – dropdown values taken verbatim from the Excel sheet **DND-Dropdown_list**
- `src/lib/types.ts` – Case model = every Excel column + new workflow fields (see `docs/EXCEL_FIELD_MAPPING.md`)
- `src/lib/store.ts` – mock service layer (one action ≙ one Odoo 19 endpoint; see `src/lib/api/odoo-contract.ts`)
- `src/lib/permissions.ts` – role visibility (UI only, **not security** – use ir.rule in Odoo)
- `src/components/{layout,dashboard,cases,common,ui}` – AppSidebar, AppHeader, DashboardStats, CaseDataTable, CaseRegistrationWizard, CaseDetailsTabs, CaseTimeline, AssignmentDialog/TransferDialog, ProvinceSelector, StatusBadge/PriorityBadge, NotificationPanel

## Odoo mode (real backend) — all UI stays in Next.js
1. Install Odoo module `otm_iof_seva` (backend only: data, security, workflow, JSON API `otm.iof.api`).
2. `.env.local`: `NEXT_PUBLIC_DATA_SOURCE=odoo`, `ODOO_URL=http://127.0.0.1:8069`, `ODOO_DB=<db>`.
3. `npm run build && npm start`. Browser never talks to Odoo: `/api/auth/login|logout`, `/api/odoo` (whitelisted methods), `/api/site` (website CMS) proxy it with an httpOnly session cookie.
4. Demo users (testing only): `odoo-bin shell -d <db> < docs/odoo-demo-seed.py` (password Demo@12345).
Remove `NEXT_PUBLIC_DATA_SOURCE` to get the browser-only demo again.

## Performance (10,000+ cases)
Case list, search, filter, sort and paging, dashboard, reports and province pages run as PostgreSQL queries in Odoo (`list_cases`, `stats`, `export_cases`, `get_case`). The browser only receives one page (25 rows) or the aggregate numbers. Measured on 10,001 cases: list 10-30 ms, search ~50 ms, dashboard stats ~250 ms (server side).
