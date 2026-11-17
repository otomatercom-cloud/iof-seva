#!/usr/bin/env bash
# Copies the public-site photos from iofseva.org into web/public/site (run once on the server, then rebuild
# with NEXT_PUBLIC_IMG_BASE=/site in .env.production).
set -euo pipefail
cd "$(dirname "$0")/.."
B="https://iofseva.org/wp-content/uploads/2026/06"; mkdir -p public/site
for f in 11.jpeg 4-1.jpeg 7-1.jpeg 9.jpeg WhatsApp-Image-2026-06-08-at-8.59.13-AM-Photoroom.png WhatsApp-Image-2026-06-08-at-9.48.48-AM.jpeg WhatsApp-Image-2026-06-08-at-9.48.50-AM.jpeg; do
  curl -fsSL -o "public/site/$f" "$B/$f" && echo "ok $f"
done
echo "Now: echo NEXT_PUBLIC_IMG_BASE=/site >> .env.production && npm run build && pm2 restart iof-website --update-env"
