#!/usr/bin/env bash
# IOF Seva server deploy. Run as root/sudo on the server:
#   sudo ./scripts/deploy-server.sh                      # web only (git pull, build, restart)
#   sudo ./scripts/deploy-server.sh -m otm_iof_seva,otm_iof_volunteer_portal   # also update Odoo modules (stops Odoo first)
#   add -i for modules to INSTALL (first time), e.g.  -i otm_iof_volunteer_portal
set -euo pipefail
REPO=/opt/iof-seva; WEB=$REPO/web; DB=demo; CONF=/etc/elysians.conf
SVC=elysians; PY=/opt/elysians/elysians-venv/bin/python3; ODOO=/opt/elysians/odoo/odoo-bin; PM2APP=iof-website
UPD=""; INS=""
while getopts "m:i:" o; do case $o in m) UPD=$OPTARG;; i) INS=$OPTARG;; esac; done

cd "$REPO" && git pull --ff-only
if [ -n "$UPD$INS" ]; then
  echo ">> stopping $SVC"; systemctl stop "$SVC"
  trap 'echo ">> starting $SVC"; systemctl start "$SVC"' EXIT      # always bring Odoo back, even on error
  ARGS=(); [ -n "$INS" ] && ARGS+=(-i "$INS"); [ -n "$UPD" ] && ARGS+=(-u "$UPD")
  sudo -u elysians "$PY" "$ODOO" -c "$CONF" -d "$DB" "${ARGS[@]}" --stop-after-init
fi
cd "$WEB"; npm ci
NODE_OPTIONS=--max-old-space-size=1536 npm run build
test -f .next/BUILD_ID
pm2 restart "$PM2APP" --update-env
echo ">> done"
