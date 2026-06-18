#!/usr/bin/env bash
# ══════════════════════════════════════════════
# TIK TAK RUN — Phase 1 Health Test
# Usage: ./test-phase1.sh
# ══════════════════════════════════════════════
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

PASS=0
FAIL=0
RESULTS=()

log()     { echo "[$(date '+%H:%M:%S')] $*"; }
pass()    { PASS=$((PASS+1)); RESULTS+=("✅ PASS: $1"); echo "  ✅ PASS: $1"; }
fail()    { FAIL=$((FAIL+1)); RESULTS+=("❌ FAIL: $1"); echo "  ❌ FAIL: $1"; }
section() { echo; echo "──────────────────────────────────────"; echo "  $1"; echo "──────────────────────────────────────"; }

cd "$PROJECT_DIR"

echo ""
echo "╔══════════════════════════════════════╗"
echo "║   TIK TAK RUN — Phase 1 Tests       ║"
echo "╚══════════════════════════════════════╝"

# ─── Section 1: File Structure ───────────────
section "📁 File Structure"

check_file() {
  if [ -f "$PROJECT_DIR/$1" ]; then
    pass "File exists: $1"
  else
    fail "Missing file: $1"
  fi
}
check_dir() {
  if [ -d "$PROJECT_DIR/$1" ]; then
    pass "Directory exists: $1"
  else
    fail "Missing directory: $1"
  fi
}

check_file "package.json"
check_file "pnpm-workspace.yaml"
check_file "turbo.json"
check_file "tsconfig.base.json"
check_file ".gitignore"
check_file ".env.example"
check_file "docker-compose.yml"
check_file "docker-compose.dev.yml"
check_file "README.md"
check_file "DEPLOYMENT.md"
check_dir  "apps/api/src"
check_dir  "apps/web/src"
check_dir  "apps/admin/src"
check_dir  "packages/shared-types/src"
check_dir  "packages/ui/src"
check_dir  "packages/config"
check_dir  "infra/docker"
check_dir  "infra/nginx"
check_dir  "infra/scripts"
check_file "apps/api/src/main.ts"
check_file "apps/api/src/health/health.controller.ts"
check_file "apps/api/prisma/schema.prisma"
check_file "apps/web/src/app/layout.tsx"
check_file "apps/admin/src/app/layout.tsx"
check_file "infra/docker/api.Dockerfile"
check_file "infra/docker/web.Dockerfile"
check_file "infra/docker/admin.Dockerfile"
check_file "infra/docker/nginx.Dockerfile"
check_file "infra/nginx/nginx.conf"
check_file "infra/nginx/sites/tiktakrun.conf"
check_file "infra/scripts/deploy.sh"
check_file "infra/scripts/backup.sh"
check_file "infra/scripts/restore.sh"
check_file "infra/scripts/ssl-setup.sh"

# ─── Section 2: Docker Services ─────────────
section "🐳 Docker Services"

log "Starting services with docker compose..."
if docker compose -f "$PROJECT_DIR/docker-compose.dev.yml" up -d 2>&1; then
  pass "docker compose up succeeded"
else
  fail "docker compose up failed"
fi

log "Waiting 30 seconds for services to start..."
sleep 30

# ─── Section 3: Health Checks ────────────────
section "🏥 Health Checks"

check_url() {
  local url=$1 label=$2 expected=${3:-200}
  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null || echo "000")
  if [ "$status" = "$expected" ]; then
    pass "$label → HTTP $status"
  else
    fail "$label → Expected $expected, got $status (URL: $url)"
  fi
}

check_json() {
  local url=$1 label=$2 key=$3 value=$4
  local resp
  resp=$(curl -sf --max-time 10 "$url" 2>/dev/null || echo "{}")
  if echo "$resp" | grep -q "\"$key\":$value" 2>/dev/null || echo "$resp" | grep -q "\"$key\":\"$value\"" 2>/dev/null; then
    pass "$label — JSON key '$key' = '$value'"
  else
    fail "$label — JSON key '$key' != '$value' (response: ${resp:0:100})"
  fi
}

# API Health
check_url  "http://localhost:4000/api/v1/health" "API /health"
check_json "http://localhost:4000/api/v1/health" "API health.data.success" "status" "ok"

# Web
check_url "http://localhost:3000" "Web (port 3000)"

# Admin
check_url "http://localhost:3001" "Admin (port 3001)"

# ─── Section 4: ENV Validation ───────────────
section "🔑 ENV Variables"

check_env() {
  if grep -q "^$1=" "$PROJECT_DIR/.env.example" 2>/dev/null; then
    pass ".env.example has: $1"
  else
    fail ".env.example missing: $1"
  fi
}

check_env "DATABASE_URL"
check_env "REDIS_URL"
check_env "JWT_ACCESS_SECRET"
check_env "JWT_REFRESH_SECRET"
check_env "SMSIR_API_KEY"
check_env "ZARINPAL_MERCHANT_ID"
check_env "NEXT_PUBLIC_API_URL"
check_env "STORAGE_PATH"

# ─── Section 5: Port Config ──────────────────
section "🔌 Port Configuration"

check_port() {
  if curl -s --max-time 3 "http://localhost:$1" > /dev/null 2>&1; then
    pass "Port $1 ($2) is responding"
  else
    fail "Port $1 ($2) is NOT responding"
  fi
}

check_port 4000 "API"
check_port 3000 "Web"
check_port 3001 "Admin"

# ─── Section 6: Shared Types ─────────────────
section "📦 Packages"

check_file "packages/shared-types/src/enums.ts"
check_file "packages/shared-types/src/entities.ts"
check_file "packages/shared-types/src/api.ts"
check_file "packages/ui/src/Button.tsx"
check_file "packages/ui/src/Modal.tsx"
check_file "packages/ui/src/Card.tsx"
check_file "packages/config/tailwind-config/base.ts"

# ─── Results ─────────────────────────────────
echo ""
echo "╔══════════════════════════════════════╗"
echo "║          TEST RESULTS                ║"
echo "╠══════════════════════════════════════╣"
printf "║  ✅ PASSED: %-3d  ❌ FAILED: %-3d      ║\n" "$PASS" "$FAIL"
echo "╚══════════════════════════════════════╝"
echo ""

if [ ${#RESULTS[@]} -gt 0 ]; then
  echo "Details:"
  for r in "${RESULTS[@]}"; do echo "  $r"; done
  echo ""
fi

if [ "$FAIL" -eq 0 ]; then
  echo "🎉 ALL TESTS PASSED — Phase 1 is ready!"
  exit 0
else
  echo "⚠️  $FAIL test(s) failed. Review and fix before proceeding to Phase 2."
  exit 1
fi
