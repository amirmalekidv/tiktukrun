#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# TIK TAK RUN — Server Update Script
# ═══════════════════════════════════════════════════════════════════════════
# Run on the server after code is synced (git pull or rsync from local).
#
# Usage (on server):
#   bash infra/scripts/update.sh
#
# Options (env vars):
#   GIT_PULL=no          Skip git pull (e.g. after rsync)
#   GIT_BRANCH=main      Branch to pull
#   PRUNE_BUILD_CACHE=no Skip docker builder prune after build
#   SKIP_BACKUP=1        Skip pre-update backup
# ═══════════════════════════════════════════════════════════════════════════
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

# shellcheck disable=SC1091
source "$SCRIPT_DIR/lib/compose.sh"
deploy_compose_init

echo "╔══════════════════════════════════════════════════════════╗"
echo "║       TIK TAK RUN — Server Update                        ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo "  Project:  $PROJECT_ROOT"
echo "  Mode:     ${DEPLOY_MODE:-standalone}"
echo ""

command -v docker >/dev/null 2>&1 || { echo "❌ Docker not installed"; exit 1; }
docker compose version >/dev/null 2>&1 || { echo "❌ Docker Compose v2 required"; exit 1; }

if [ ! -f .env ]; then
    echo "❌ .env missing — copy .env.example and configure production values"
    exit 1
fi

echo "📁 Preparing persistent storage..."
mkdir -p storage/uploads storage/backups
chown -R 1001:1001 storage

# ─── [1/6] Backup ─────────────────────────────────────────────────────────
if [ "${SKIP_BACKUP:-0}" != "1" ]; then
    echo "[1/6] Pre-update backup..."
    bash "$SCRIPT_DIR/backup.sh" || echo "  ⚠️  Backup failed (continuing)"
else
    echo "[1/6] Skipping backup (SKIP_BACKUP=1)"
fi

# ─── [2/6] Pull code ──────────────────────────────────────────────────────
if [ "${GIT_PULL:-yes}" = "yes" ] && [ -d .git ]; then
    echo "[2/6] Pulling latest code..."
    branch="${GIT_BRANCH:-$(git rev-parse --abbrev-ref HEAD)}"
    git fetch origin "$branch"
    git pull --ff-only origin "$branch"
else
    echo "[2/6] Skipping git pull"
fi

# ─── [3/6] Build images ───────────────────────────────────────────────────
echo "[3/6] Building Docker images (api, web, admin)..."
dc build --pull api web admin

# ─── [4/6] Start infra + API, sync schema ─────────────────────────────────
echo "[4/6] Restarting stack..."
dc up -d mongo redis
deploy_wait_healthy mongo 120
dc up -d mongo-init
sleep 3
dc up -d api
deploy_wait_healthy api 180

echo "  📊 Syncing database schema..."
dc exec -T api npx prisma db push --skip-generate

# ─── [5/6] Restart frontends ──────────────────────────────────────────────
echo "[5/6] Restarting web + admin..."
if [ "${DEPLOY_MODE:-standalone}" = "standalone" ]; then
    dc up -d web admin nginx
else
    dc up -d web admin
    echo "  ℹ️  Shared mode — host nginx handles 80/443"
fi

deploy_wait_healthy web 120
deploy_wait_healthy admin 120

dc up -d --remove-orphans
echo "[6/6] Verification..."
sleep 3
dc ps
deploy_health_smoke
deploy_maybe_prune_build_cache

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  ✅  Update complete                                     ║"
echo "║                                                          ║"
echo "║  Site:  https://${PROD_DOMAIN:-tiktakrun.ir}               ║"
echo "║  Admin: https://admin.${PROD_DOMAIN:-tiktakrun.ir}       ║"
echo "║  API:   https://api.${PROD_DOMAIN:-tiktakrun.ir}         ║"
echo "╚══════════════════════════════════════════════════════════╝"
