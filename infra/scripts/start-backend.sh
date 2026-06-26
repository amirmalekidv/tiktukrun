#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

if ! docker info >/dev/null 2>&1; then
  echo "Docker is not running. Open Docker Desktop, wait until it is ready, then rerun:"
  echo "  bash infra/scripts/start-backend.sh"
  exit 1
fi

echo "==> Starting MongoDB, Redis, and API..."
docker compose up -d --build mongo mongo-init redis api

echo "==> Waiting for API health..."
for i in $(seq 1 60); do
  if curl -fsS http://127.0.0.1:4000/health >/dev/null 2>&1; then
    echo "API is healthy."
    curl -s http://127.0.0.1:4000/health
    echo
    echo "Swagger: http://localhost:4000/api/v1/docs"
    exit 0
  fi
  sleep 2
done

echo "API did not become healthy in time. Recent logs:"
docker compose logs --tail=50 api
exit 1
