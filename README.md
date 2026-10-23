# IOF Seva: Next.js website + Odoo 19 volunteer registration

- `odoo/iof_volunteer_registration`: Odoo 19 addon (model, workflow, views, security, API)
- `web`: Next.js 15 site (TypeScript, Tailwind v4, shadcn-style components)
- `docs`: API contract, deployment, test report

Tests: `cd web && npm test`. End-to-end: `web/scripts/e2e.py` (needs running Odoo + Next.js, see header of the script).
