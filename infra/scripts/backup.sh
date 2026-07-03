#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# TIK TAK RUN — Database + Uploads Backup
# ═══════════════════════════════════════════════════════════════════════════
# Usage: ./backup.sh
# CronTab: 0 3 * * * cd /home/tiktakrun && bash infra/scripts/backup.sh
# ═══════════════════════════════════════════════════════════════════════════
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKUP_DIR="${BACKUP_PATH:-/var/backups/tiktakrun}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"
cd "$PROJECT_ROOT"

# Load env
if [ -f .env ]; then
    set -a
    source .env
    set +a
fi

echo "📦 Starting backup at $TIMESTAMP"

# ─── DB Dump (MongoDB) ──────────────────────────────────────────────────────
DB_BACKUP="$BACKUP_DIR/db_${TIMESTAMP}.archive.gz"
echo "  → Dumping MongoDB to $DB_BACKUP"
docker compose exec -T mongo mongodump \
    -u "${MONGO_USER:-tiktakrun}" \
    -p "${MONGO_PASSWORD}" \
    --authenticationDatabase admin \
    --db "${MONGO_DB:-tiktakrun_db}" \
    --archive --gzip \
    > "$DB_BACKUP"

DB_SIZE=$(du -h "$DB_BACKUP" | cut -f1)
echo "  ✅ Database backup: $DB_SIZE"

# ─── Uploads Backup ───────────────────────────────────────────────────────
UPLOADS_BACKUP="$BACKUP_DIR/uploads_${TIMESTAMP}.tar.gz"
if [ -d "./storage/uploads" ] && [ "$(ls -A ./storage/uploads 2>/dev/null)" ]; then
    echo "  → Archiving uploads to $UPLOADS_BACKUP"
    tar -czf "$UPLOADS_BACKUP" -C ./storage uploads
    UPLOADS_SIZE=$(du -h "$UPLOADS_BACKUP" | cut -f1)
    echo "  ✅ Uploads backup: $UPLOADS_SIZE"
fi

# ─── Cleanup old backups ──────────────────────────────────────────────────
echo "  → Cleaning backups older than $RETENTION_DAYS days"
find "$BACKUP_DIR" -name "db_*.archive.gz" -mtime "+$RETENTION_DAYS" -delete
find "$BACKUP_DIR" -name "db_*.sql.gz" -mtime "+$RETENTION_DAYS" -delete
find "$BACKUP_DIR" -name "uploads_*.tar.gz" -mtime "+$RETENTION_DAYS" -delete

echo "✅ Backup complete: $BACKUP_DIR"
ls -lh "$BACKUP_DIR" | tail -10
