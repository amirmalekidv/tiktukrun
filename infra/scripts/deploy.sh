#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# TIK TAK RUN — Production Deployment Script
# ═══════════════════════════════════════════════════════════════════════════
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_ROOT"

echo "╔══════════════════════════════════════════════════════════╗"
echo "║       TIK TAK RUN — Production Deployment              ║"
echo "╚══════════════════════════════════════════════════════════╝"

# ─── Check prerequisites ──────────────────────────────────────────────────
command -v docker >/dev/null 2>&1 || { echo "❌ Docker not installed"; exit 1; }
docker compose version >/dev/null 2>&1 || { echo "❌ Docker Compose v2 required"; exit 1; }

if [ ! -f .env ]; then
    echo "❌ .env file missing. Copy .env.example to .env and configure it."
    exit 1
fi

# ─── Pre-deploy backup ────────────────────────────────────────────────────
if docker ps --format '{{.Names}}' | grep -q tiktakrun-postgres; then
    echo "📦 Creating pre-deploy backup..."
    bash "$SCRIPT_DIR/backup.sh" || echo "⚠️  Backup failed (continuing)"
fi

# ─── Pull / build images ──────────────────────────────────────────────────
echo "🔨 Building Docker images..."
docker compose build --pull

# ─── Start services ───────────────────────────────────────────────────────
echo "🚀 Starting services..."
docker compose up -d

# ─── Wait for DB ──────────────────────────────────────────────────────────
echo "⏳ Waiting for PostgreSQL to be healthy..."
for i in {1..60}; do
    if docker compose exec -T postgres pg_isready -U "${POSTGRES_USER:-tiktakrun}" >/dev/null 2>&1; then
        echo "✅ PostgreSQL ready"
        break
    fi
    sleep 2
done

# ─── Run migrations ───────────────────────────────────────────────────────
echo "📊 Running database migrations..."
docker compose exec -T api npx prisma migrate deploy

# ─── Optional: Seed (only if explicitly requested) ────────────────────────
if [ "${SEED:-no}" = "yes" ]; then
    echo "🌱 Seeding database..."
    docker compose exec -T api pnpm seed || echo "⚠️ Seed failed (may already be seeded)"
fi

# ─── Health checks ────────────────────────────────────────────────────────
echo "🏥 Checking service health..."
sleep 5
docker compose ps

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  ✅  Deployment Complete!                                ║"
echo "║                                                          ║"
echo "║  🌐 Site:    https://${PROD_DOMAIN:-tiktakrun.ir}        ║"
echo "║  👨‍💼 Admin:   https://admin.${PROD_DOMAIN:-tiktakrun.ir} ║"
echo "║  📚 API:     https://api.${PROD_DOMAIN:-tiktakrun.ir}    ║"
echo "║  📖 Swagger: /api/v1/docs                                ║"
echo "╚══════════════════════════════════════════════════════════╝"
