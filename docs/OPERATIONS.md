# IOF Seva – Operations guide (backup, retention, security, go-live)

## 1. Architecture
Browser -> Next.js server (`web`, port 3000) -> Odoo 19 (`odoo/otm_iof_seva`, port 8069, **not public**) -> PostgreSQL + filestore.
Only the Next.js server should reach Odoo. Put Odoo behind the firewall / private network; expose only the Next.js site over HTTPS.

## 2. Go-live checklist
1. Odoo: install `otm_iof_seva`, create real users (Settings > Users, or Seva portal > Users). Delete demo users (`*@iof.demo`).
2. Odoo System Parameters: `otm_iof_seva.public_key` = long random string. Same value in web `.env.local` as `IOF_PUBLIC_KEY`.
3. Odoo `odoo.conf`: `list_db = False`, strong `admin_passwd`, `proxy_mode = True` when behind nginx, `workers >= 4` for production.
4. Web `.env.local`: `NEXT_PUBLIC_DATA_SOURCE=odoo`, `ODOO_URL`, `ODOO_DB`. Run `npm ci && npm run build && npm start` under systemd/pm2.
5. HTTPS only (nginx/Caddy). Cookies are `secure` in production automatically.
6. Import the Excel register: IOF Seva > Configuration > Import Excel Register. Check the warnings list.
7. Run module tests: `odoo-bin -d <db> -u otm_iof_seva --test-tags /otm_iof_seva --stop-after-init`.

## 3. Backup (victim data is sensitive: back up daily, test restore monthly)
Daily (cron, 02:00):
```
pg_dump -Fc -U odoo <db> > /backup/iof-$(date +%F).dump
tar czf /backup/iof-filestore-$(date +%F).tgz ~odoo/.local/share/Odoo/filestore/<db>
find /backup -name 'iof-*' -mtime +30 -delete        # keep 30 days
```
Copy backups off the server (encrypted, e.g. `age`/`gpg`, to a different region/provider). Restore test:
`createdb restore_test && pg_restore -d restore_test iof-DATE.dump`, restore filestore, start Odoo on a spare port, open a case with a document.

## 4. Retention policy (proposal – IOF to approve)
| Data | Keep | Then |
|---|---|---|
| Open cases | until closed | – |
| Closed cases + timeline + finance | 7 years | anonymise victim name/contact/passport, keep statistics |
| Documents (passport, medical) | 2 years after closure | delete attachment |
| Public-form reports never converted | 1 year | delete |
| Backups | 30 days rolling + 1 monthly for 12 months | delete |
Deletion/anonymisation should be run by a President-approved scheduled action; cases are never hard-deleted in the UI (audit trail is immutable).

## 5. Security notes
- Authorisation is enforced by Odoo (groups + record rules); the Next.js UI only hides things. Never expose Odoo directly.
- Next.js adds CSP, X-Frame-Options, nosniff, HSTS, Referrer-Policy; login is limited to 8 attempts / 15 min per IP+e-mail; API calls check Origin; request size capped at 20 MB.
- Public report form: honeypot, min fill time, 5/h per IP, 300/day, shared-secret between Next.js and Odoo.
- Timeline events are immutable; closed cases are locked; only the President can reopen.
- Rotate `IOF_PUBLIC_KEY` and Odoo `admin_passwd` yearly; disable users who leave (Users page) – never delete.
- Rate limiter is per Next.js process; for several instances put the limit in nginx (`limit_req`) as well.

## 6. Monitoring
- Odoo log: errors "public report failed", cron "escalate unassigned cases" (daily).
- Uptime check on `/login` (web) and `/iof/site` (through web: `/api/site`).

## Notifications (Phase 7)
- Events (new case, assigned, critical, transfer request / transferred in / decided, status change, overdue) are configured by the President in portal **Settings → Alert events** (or Odoo: IOF Seva → Configuration → Notifications). Each user sets their own e-mail / WhatsApp in **Settings → My alerts**.
- Messages contain only case no., issue type and committee + a link. Never victim or passport data.
- **E-mail**: configure an outgoing mail server in Odoo; mails go through the standard mail queue.
- **WhatsApp**: Odoo POSTs `{"to","text","event","caseId"}` (Bearer token) to a gateway/middleware URL. Set system parameters `otm_iof_seva.whatsapp_url`, `otm_iof_seva.whatsapp_token`. Queue = IOF Seva → Configuration → WhatsApp Outbox (3 retries, sent rows purged after 30 days). Meta Cloud API needs approved templates: let the middleware map the text to a template.
- `otm_iof_seva.portal_url` (e.g. https://seva.example.org) adds a case link to messages.

## Merged public site (Phase 8)
The public website (volunteer registration, support tickets, CMS, visual editor) comes from the separate "iof-seva1" build; see `docs/DEPLOYMENT_SITE.md` and `docs/VOLUNTEER_API.md`. The old simple Website CMS and `/report` form of the portal were removed; `/support` replaces `/report`. Required system parameter: none new; `otm_iof_seva.public_key` is no longer used.
