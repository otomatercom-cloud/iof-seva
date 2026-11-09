# IOF Seva
- odoo/otm_iof_seva : Odoo 19 backend module (copy into addons path, install / upgrade).
- web : Next.js frontend. cp .env.example .env.local ; npm install ; npm run build ; npm start
After upgrading the module restart Odoo with -u otm_iof_seva (new indexed fields).

## Public "Report a case" form
Website `/report` -> Next.js `/api/report` -> Odoo `/iof/public-report`. Creates a submitted case (source = Website) in the awaiting-assignment queue of the chosen committee's region (or national if unknown). Protections: honeypot field, minimum fill time, 5 reports/hour per IP, 300/day overall, consent required.
Set the same secret in Odoo (System Parameter `otm_iof_seva.public_key`) and in the web `.env.local` (`IOF_PUBLIC_KEY`) so only your Next.js server can call these Odoo routes.
