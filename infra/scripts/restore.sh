#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# TIK TAK RUN — Database Restore from Backup
# ═══════════════════════════════════════════════════════════════════════════
# Usage: ./restore.sh /var/backups/tiktakrun/db_20260101_030000.sql.gz
# ═══════════════════════════════════════════════════════════════════════════
set -euo pipefail

if [ $# -lt 1 ]; then
    echo "Usage: $0 <db_backup.sql.gz> [uploads_backup.tar.gz]"
    echo ""
    echo "Available backups:"
    ls -lh "${BACKUP_PATH:-/var/backups/tiktakrun}" 2>/dev/null || echo "  (none found)"
    exit 1
fi

DB_BACKUP="$1"
UPLOADS_BACKUP="${2:-}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

if [ -f .env ]; then
    set -a; source .env; set +a
fi

[ ! -f "$DB_BACKUP" ] && { echo "Backup file not found: $DB_BACKUP"; exit 1; }

echo "WARNING: This will DROP and RECREATE the database!"
echo "  DB:     ${POSTGRES_DB:-tiktakrun_db}"
echo "  Backup: $DB_BACKUP"
read -r -p "Type 'RESTORE' to confirm: " confirm
[ "$confirm" != "RESTORE" ] && { echo "Aborted."; exit 1; }

echo "Stopping API to free DB connections..."
docker compose stop api web admin || true

echo "Restoring database (MongoDB)..."
docker compose exec -T mongo mongorestore \
    -u "${MONGO_USER:-tiktakrun}" \
    -p "${MONGO_PASSWORD}" \
    --authenticationDatabase admin \
    --archive --gzip --drop \
    < "$DB_BACKUP"

if [ -n "$UPLOADS_BACKUP" ] && [ -f "$UPLOADS_BACKUP" ]; then
    echo "Restoring uploads..."
    rm -rf ./storage/uploads.bak
    [ -d ./storage/uploads ] && mv ./storage/uploads ./storage/uploads.bak
    tar -xzf "$UPLOADS_BACKUP" -C ./storage
fi

echo "Restarting services..."
docker compose up -d

echo "Restore complete!"
