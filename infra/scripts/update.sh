#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# TIK TAK RUN — Zero-Downtime Update Script
# ═══════════════════════════════════════════════════════════════════════════
# Pull latest code, rebuild images, run migrations, restart services
# ═══════════════════════════════════════════════════════════════════════════
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

echo "============================================="
echo "  TIK TAK RUN — Update"
echo "============================================="

# Pre-update backup
echo "[1/5] Creating pre-update backup..."
bash "$SCRIPT_DIR/backup.sh" || echo "  Backup failed (continuing anyway)"

# Pull latest code (if git repo)
if [ -d .git ]; then
    echo "[2/5] Pulling latest code..."
    git pull --ff-only
else
    echo "[2/5] Skipping git pull (not a git repo)"
fi

# Rebuild images
echo "[3/5] Rebuilding Docker images..."
docker compose build --pull

# Sync DB schema (MongoDB — db push instead of migrate)
echo "[4/5] Syncing database schema..."
docker compose up -d mongo mongo-init redis
sleep 5
docker compose run --rm api npx prisma db push --skip-generate

# Rolling restart
echo "[5/5] Restarting services..."
docker compose up -d --remove-orphans

sleep 5
docker compose ps

echo ""
echo "============================================="
echo "  Update complete!"
echo "============================================="
