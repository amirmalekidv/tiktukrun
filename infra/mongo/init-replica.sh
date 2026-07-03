#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# TIK TAK RUN — MongoDB Replica Set Initializer
# این اسکریپت یک‌بار اجرا می‌شود و replica set با نام rs0 را راه‌اندازی می‌کند.
# replica set برای پشتیبانی از transaction های Prisma روی MongoDB الزامی است.
# ═══════════════════════════════════════════════════════════════════════════
set -euo pipefail

MONGO_USER="${MONGO_USER:-tiktakrun}"
MONGO_PASSWORD="${MONGO_PASSWORD:?MONGO_PASSWORD is required}"
HOST="mongo:27017"

mongo_eval() {
  mongo --host "$HOST" \
    -u "$MONGO_USER" \
    -p "$MONGO_PASSWORD" \
    --authenticationDatabase admin \
    --quiet \
    --eval "$1"
}

echo "⏳ انتظار برای آماده‌شدن MongoDB..."
until mongo_eval "db.adminCommand('ping').ok" >/dev/null 2>&1; do
  sleep 2
done

echo "🔍 بررسی وضعیت replica set..."
STATUS="$(mongo_eval "try { rs.status().ok } catch (e) { 0 }" || echo "0")"

if [ "$STATUS" = "1" ]; then
  echo "✅ replica set از قبل راه‌اندازی شده است."
  exit 0
fi

echo "🚀 راه‌اندازی replica set rs0..."
mongo_eval "
  rs.initiate({
    _id: 'rs0',
    members: [{ _id: 0, host: '$HOST', priority: 1 }]
  })
"

echo "⏳ انتظار برای انتخاب PRIMARY..."
until mongo_eval "db.isMaster().ismaster" 2>/dev/null | grep -q "true"; do
  sleep 2
done

echo "✅ replica set rs0 با موفقیت راه‌اندازی شد و PRIMARY آماده است."
