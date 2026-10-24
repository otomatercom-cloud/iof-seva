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

## Editing the website from Odoo (iof_site_content)

Odoo menu **Website Content**: *Photo Gallery* (upload/reorder/hide photos), *Reports* (text + optional PDF),
*Page Texts* (every heading/paragraph/button/menu label/contact detail/legal text, inline-editable, "Reset to default"),
*Lists & Cards* (pillars, impact, FAQ, forums, services strip, tags, steps…, with icon picker). Logo and home photo are
image rows in Page Texts. Groups: Editor (edit/create items) and Manager.
The site reads `GET /api/iof/site-content` (public data only) and caches for `CONTENT_REVALIDATE_S` (30s), so edits
show within ~30-60 s. If Odoo is down the site renders built-in defaults.
Single source of truth for texts is `web/src/content/defaults.ts`; after adding a new editable text run
`npm run content:export` and upgrade the addon (`-u iof_site_content`). Existing staff edits are kept (noupdate).
Set `ODOO_PUBLIC_URL` if media must be served from a different URL than `ODOO_BASE_URL`.
Not editable in Odoo (code): the volunteer form's field labels/validation messages and visual design.
Install: `-i iof_site_content`. Uploads: images JPG/PNG/WebP/GIF ≤8MB (SVG refused), reports PDF ≤15MB.
