#!/usr/bin/env bash
# Daily backup of the IOF Seva Odoo database + filestore (case documents). Keeps 14 days.
# Install:  sudo cp scripts/backup-server.sh /usr/local/bin/iof-backup && sudo chmod 700 /usr/local/bin/iof-backup
#           echo '30 2 * * * root /usr/local/bin/iof-backup >> /var/log/iof-backup.log 2>&1' | sudo tee /etc/cron.d/iof-backup
# Restore:  see docs/OPERATIONS.md ("Backups").
set -euo pipefail
DB=demo; DEST=/var/backups/iof-seva; KEEP=14
DATA=$(sudo -u elysians /opt/elysians/elysians-venv/bin/python3 - <<'PY'
import configparser,os
c=configparser.ConfigParser();c.read('/etc/elysians.conf');print(c['options'].get('data_dir','/var/lib/odoo'))
PY
)
mkdir -p "$DEST"; chmod 700 "$DEST"; TS=$(date +%F-%H%M)
sudo -u postgres pg_dump -Fc "$DB" > "$DEST/$DB-$TS.dump"
[ -d "$DATA/filestore/$DB" ] && tar -C "$DATA/filestore" -czf "$DEST/$DB-files-$TS.tgz" "$DB"
find "$DEST" -type f -mtime +$KEEP -delete
echo "backup ok $TS: $(du -sh "$DEST" | cut -f1)"
