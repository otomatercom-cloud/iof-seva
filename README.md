# IOF Seva: Next.js website + Odoo 19 volunteer registration

- `odoo/iof_volunteer_registration`: Odoo 19 addon (model, workflow, views, security, API)
- `web`: Next.js 15 site (TypeScript, Tailwind v4, shadcn-style components)
- `docs`: API contract, deployment, test report

Tests: `cd web && npm test`. End-to-end: `web/scripts/e2e.py` (needs running Odoo + Next.js, see header of the script).

## Volunteer ID card (iof_volunteer_card)

Bridge addon: depends on `iof_volunteer_registration` + your `association_membership` (install both, untouched).
On **Approve** of a volunteer in Odoo: creates a membership application (type "IOF Volunteer", fee 0, 2 years) →
member → active membership → card token, links it back on the volunteer, and best-effort emails the PDF card
(QR → `/membership/verify/<token>`). Buttons: Issue / Print / Email ID Card. Optional passport photo is uploaded
from the website (resized to ≤480px JPEG in browser, validated by magic bytes in Odoo, ≤400 KB) or by staff in Odoo.
Install order: `-i association_membership,iof_volunteer_registration,iof_volunteer_card`.
Notes: card email needs outgoing mail server; PDF needs wkhtmltopdf; verify page needs the `website` module that association_membership already uses.
