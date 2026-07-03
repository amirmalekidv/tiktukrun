#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# TIK TAK RUN — Production Deployment Script (first install)
# ═══════════════════════════════════════════════════════════════════════════
# Usage:
#   SEED=yes bash infra/scripts/deploy.sh    # first deploy with seed data
#   bash infra/scripts/deploy.sh             # first deploy without seed
#
# For updates after initial deploy, use: bash infra/scripts/update.sh
# ═══════════════════════════════════════════════════════════════════════════
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

# shellcheck disable=SC1091
source "$SCRIPT_DIR/lib/compose.sh"
deploy_compose_init

cleanup_on_error() {
    local exit_code="$1"
    if [ "$exit_code" -ne 0 ]; then
        echo "🧯 Deployment failed — stopping partial tiktakrun stack..."
        dc down >/dev/null 2>&1 || true
    fi
}
trap 'cleanup_on_error $?' EXIT

echo "╔══════════════════════════════════════════════════════════╗"
echo "║       TIK TAK RUN — Production Deployment              ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo "  Mode: ${DEPLOY_MODE:-standalone}"
echo ""

command -v docker >/dev/null 2>&1 || { echo "❌ Docker not installed"; exit 1; }
docker compose version >/dev/null 2>&1 || { echo "❌ Docker Compose v2 required"; exit 1; }

if [ ! -f .env ]; then
    echo "❌ .env file missing. Copy .env.example to .env and configure it."
    exit 1
fi

echo "📁 Preparing writable storage..."
mkdir -p storage/uploads storage/backups
chown -R 1001:1001 storage

if docker ps --format '{{.Names}}' | grep -q tiktakrun-mongo; then
    echo "⚠️  Stack already running — use infra/scripts/update.sh for updates"
    exit 1
fi

echo "🔨 Building Docker images..."
dc build --pull

echo "🚀 Starting services..."
if [ "${DEPLOY_MODE:-standalone}" = "standalone" ]; then
    dc up -d
else
    dc up -d mongo mongo-init redis api web admin
    echo "  ℹ️  Shared mode — configure host nginx (see infra/nginx/host/tiktakrun.conf.example)"
fi

deploy_wait_healthy mongo 120
deploy_wait_healthy api 180

echo "📊 Syncing database schema..."
dc exec -T api npx prisma db push --skip-generate

if [ "${SEED:-no}" = "yes" ]; then
    echo "🌱 Seeding database..."
    dc exec -T api pnpm seed || echo "⚠️ Seed failed (may already be seeded)"
fi

echo "🏥 Checking service health..."
sleep 5
dc ps
deploy_health_smoke
deploy_maybe_prune_build_cache

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  ✅  Deployment Complete!                                ║"
echo "║                                                          ║"
echo "║  🌐 Site:    https://${PROD_DOMAIN:-tiktakrun.ir}        ║"
echo "║  👨‍💼 Admin:   https://admin.${PROD_DOMAIN:-tiktakrun.ir} ║"
echo "║  📚 API:     https://api.${PROD_DOMAIN:-tiktakrun.ir}    ║"
echo "║                                                          ║"
echo "║  Next updates: bash infra/scripts/update.sh              ║"
echo "╚══════════════════════════════════════════════════════════╝"
trap - EXIT
