#!/bin/bash
# ============================================================
# TIK TAK RUN — Database Backup Script
# استفاده: bash prisma/scripts/backup-dump.sh
#          bash prisma/scripts/backup-dump.sh --restore backup_file.sql.gz
# ============================================================

set -e

# ─── تنظیمات ─────────────────────────────────────────────────
DB_NAME="${POSTGRES_DB:-tiktakrun}"
DB_USER="${POSTGRES_USER:-tiktakrun}"
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/tiktakrun_${TIMESTAMP}.sql.gz"

# ─── Restore mode ─────────────────────────────────────────────
if [[ "$1" == "--restore" && -n "$2" ]]; then
  echo "🔄 بازگردانی بکاپ: $2"
  if [[ ! -f "$2" ]]; then
    echo "❌ فایل بکاپ یافت نشد: $2"
    exit 1
  fi
  gunzip -c "$2" | PGPASSWORD="${POSTGRES_PASSWORD:-secret}" psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME"
  echo "✅ بازگردانی کامل شد"
  exit 0
fi

# ─── Backup mode ──────────────────────────────────────────────
echo "════════════════════════════════════════"
echo "  TIK TAK RUN — Database Backup        "
echo "════════════════════════════════════════"
echo "📦 دیتابیس: $DB_NAME"
echo "📅 زمان: $TIMESTAMP"

# ایجاد پوشه بکاپ
mkdir -p "$BACKUP_DIR"

echo "🔄 در حال تهیه بکاپ..."

PGPASSWORD="${POSTGRES_PASSWORD:-secret}" pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --verbose \
  --no-acl \
  --no-owner \
  --format=plain \
  --encoding=UTF8 | gzip > "$BACKUP_FILE"

BACKUP_SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)

echo "✅ بکاپ ذخیره شد: $BACKUP_FILE"
echo "📏 حجم: $BACKUP_SIZE"
echo ""
echo "برای بازگردانی:"
echo "  bash prisma/scripts/backup-dump.sh --restore $BACKUP_FILE"

# پاک کردن بکاپ‌های قدیمی‌تر از ۳۰ روز
echo ""
echo "🧹 پاک کردن بکاپ‌های قدیمی (بیش از ۳۰ روز)..."
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete -print || true
echo "✅ تمام"
