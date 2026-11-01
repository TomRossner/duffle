#!/usr/bin/env bash
# Nightly backup of the database and uploaded files. Run as the duffle user from cron:
#   15 3 * * * /srv/duffle/backup.sh >> /srv/duffle/backups/backup.log 2>&1
# Copy the backups off the VPS too (Hostinger snapshots, rsync, or rclone to object storage).
set -euo pipefail

APP_DIR="${APP_DIR:-/srv/duffle}"
DAYS="${DAYS:-14}"
dest="$APP_DIR/backups"
stamp="$(date -u +%Y%m%d-%H%M%S)"

set -a
# shellcheck disable=SC1091
. "$APP_DIR/shared/.env"
set +a

mkdir -p "$dest"
pg_dump --format=custom --no-owner --dbname="$DATABASE_URL" --file="$dest/db-$stamp.dump"
tar -czf "$dest/uploads-$stamp.tar.gz" -C "$(dirname "$UPLOADS_DIR")" "$(basename "$UPLOADS_DIR")"

find "$dest" -name 'db-*.dump' -mtime +"$DAYS" -delete
find "$dest" -name 'uploads-*.tar.gz' -mtime +"$DAYS" -delete
echo "$(date -u +%FT%TZ) backup $stamp ok"
