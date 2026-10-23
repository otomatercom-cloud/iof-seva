# Installation & deployment (Linux, Nginx, HTTPS)

Inspect existing Nginx/Odoo configs first; add, never overwrite.

## 1. Odoo 19 addon
1. Copy `odoo/iof_volunteer_registration` into a custom addons path listed in `odoo.conf`.
2. Set `dbfilter = ^your_db$` in `odoo.conf` (the public API relies on it to pick the database) and serve Odoo over HTTPS.
3. Install: `odoo-bin -c odoo.conf -d your_db -i iof_volunteer_registration --stop-after-init`. Upgrades: `-u iof_volunteer_registration` with the service stopped (restart after Python changes).
4. Read the token: Settings → Technical → System Parameters → `iof_volunteer_registration.api_token` (generated at install). To rotate, edit the value and update `ODOO_API_TOKEN` in Next.js.
5. Assign staff: Settings → Users → group *IOF Volunteer Registration* (User = view/edit, Manager = approve/reject/delete/configure).
6. Only the Next.js server needs to reach `/api/iof/`; consider restricting it in Nginx by IP (`allow x.x.x.x; deny all;`).

## 2. Next.js
```
cd web && cp .env.example .env.production   # fill real values, never commit
npm ci && npm run build
pm2 start "npm start -- -p 3000" --name iof-web && pm2 save
```
Health check: `GET /api/health`.

## 3. Nginx (site)
```
server {
  server_name iofseva.org www.iofseva.org;
  listen 443 ssl http2;   # certs: certbot --nginx -d iofseva.org -d www.iofseva.org
  client_max_body_size 100k;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
server { listen 80; server_name iofseva.org www.iofseva.org; return 301 https://$host$request_uri; }
```
`X-Real-IP` is required for per-visitor rate limiting; `Host`/`X-Forwarded-Host` for the origin (CSRF) check. Also set `SITE_URL` in the env file.

## 4. Environments, backups, rollback
- Separate `.env` and Odoo token per environment (dev/staging/production); staging uses its own Odoo database.
- Backups: nightly `pg_dump -Fc your_db` plus filestore copy, stored off-server, encrypted, restore-tested. Odoo exports respect group access.
- Rollback: Next.js: `git checkout <previous tag> && npm ci && npm run build && pm2 restart iof-web`. Odoo addon: restore the pre-upgrade DB backup and previous addon folder (the module never deletes data on upgrade).
- Logs: pm2/journald. Application logs hold failure classes only, never personal data or tokens.

## 5. Before go-live
Replace hot-linked images (`src/lib/utils.ts`, `next.config.ts`) with local files in `public/`; have IOF review the Privacy Policy and Terms drafts; set real social links; point DNS. Old WordPress URLs `/about-us` and `/contact-us-2` already redirect.
