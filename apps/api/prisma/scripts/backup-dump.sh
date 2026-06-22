#!/bin/bash
# ============================================================
# TIK TAK RUN — MongoDB Backup Script
# استفاده: bash prisma/scripts/backup-dump.sh
#          bash prisma/scripts/backup-dump.sh --restore backup_file.archive.gz
# ============================================================

set -euo pipefail

MONGO_USER="${MONGO_USER:-tiktakrun}"
MONGO_PASSWORD="${MONGO_PASSWORD:-secret}"
MONGO_DB="${MONGO_DB:-tiktakrun_db}"
MONGO_HOST="${MONGO_HOST:-localhost}"
MONGO_PORT="${MONGO_PORT:-27017}"
MONGO_AUTH_DB="${MONGO_AUTH_DB:-admin}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/tiktakrun_${TIMESTAMP}.archive.gz"
MONGO_URI="mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB}?authSource=${MONGO_AUTH_DB}&replicaSet=rs0&directConnection=true"

restore_backup() {
  local input_file="$1"

  echo "🔄 بازگردانی بکاپ: ${input_file}"
  if [[ ! -f "${input_file}" ]]; then
    echo "❌ فایل بکاپ یافت نشد: ${input_file}"
    exit 1
  fi

  mongorestore \
    --uri="${MONGO_URI}" \
    --drop \
    --gzip \
    --archive="${input_file}"

  echo "✅ بازگردانی کامل شد"
}

create_backup() {
  echo "════════════════════════════════════════"
  echo "  TIK TAK RUN — MongoDB Backup         "
  echo "════════════════════════════════════════"
  echo "📦 دیتابیس: ${MONGO_DB}"
  echo "📅 زمان: ${TIMESTAMP}"

  mkdir -p "${BACKUP_DIR}"

  echo "🔄 در حال تهیه بکاپ MongoDB..."
  mongodump \
    --uri="${MONGO_URI}" \
    --gzip \
    --archive="${BACKUP_FILE}"

  BACKUP_SIZE=$(du -sh "${BACKUP_FILE}" | cut -f1)

  echo "✅ بکاپ ذخیره شد: ${BACKUP_FILE}"
  echo "📏 حجم: ${BACKUP_SIZE}"
  echo ""
  echo "برای بازگردانی:"
  echo "  bash prisma/scripts/backup-dump.sh --restore ${BACKUP_FILE}"
  echo ""
  echo "🧹 پاک کردن بکاپ‌های قدیمی (بیش از ۳۰ روز)..."
  find "${BACKUP_DIR}" -name "*.archive.gz" -mtime +30 -delete -print || true
  echo "✅ تمام"
}

if [[ "${1:-}" == "--restore" && -n "${2:-}" ]]; then
  restore_backup "$2"
else
  create_backup
fi
