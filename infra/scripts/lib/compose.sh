#!/bin/bash
# Shared Docker Compose helpers for deploy / update scripts.

deploy_lib_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
deploy_project_root="$(cd "$deploy_lib_dir/../../.." && pwd)"

deploy_load_env() {
    if [ -f "$deploy_project_root/.env" ]; then
        while IFS= read -r line || [ -n "$line" ]; do
            case "$line" in
                '' | \#*)
                    continue
                    ;;
            esac

            if [[ ! "$line" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]]; then
                continue
            fi

            key="${line%%=*}"
            value="${line#*=}"
            value="${value%$'\r'}"
            value="${value%%[[:space:]]#*}"
            value="${value%"${value##*[![:space:]]}"}"

            if [[ "$value" =~ ^\".*\"$ || "$value" =~ ^\'.*\'$ ]]; then
                value="${value:1:${#value}-2}"
            fi

            export "$key=$value"
        done < "$deploy_project_root/.env"
    fi
}

deploy_compose_init() {
    deploy_load_env
    DEPLOY_COMPOSE=(docker compose -f "$deploy_project_root/docker-compose.yml")
    case "${DEPLOY_MODE:-standalone}" in
        shared | host-nginx)
            DEPLOY_COMPOSE+=(-f "$deploy_project_root/docker-compose.shared.yml")
            ;;
    esac
}

dc() {
    "${DEPLOY_COMPOSE[@]}" "$@"
}

deploy_wait_healthy() {
    local service="$1"
    local max_wait="${2:-180}"
    local elapsed=0

    echo "  ⏳ Waiting for $service to be healthy (max ${max_wait}s)..."
    while [ "$elapsed" -lt "$max_wait" ]; do
        local cid
        cid="$(dc ps -q "$service" 2>/dev/null || true)"
        if [ -n "$cid" ]; then
            local status
            status="$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$cid" 2>/dev/null || echo "unknown")"
            if [ "$status" = "healthy" ] || [ "$status" = "running" ]; then
                echo "  ✅ $service is $status"
                return 0
            fi
        fi
        sleep 3
        elapsed=$((elapsed + 3))
    done

    echo "  ❌ $service did not become healthy in time"
    dc ps "$service" || true
    dc logs --tail=40 "$service" || true
    return 1
}

deploy_health_smoke() {
    echo "🏥 Smoke checks..."
    curl -sf "http://127.0.0.1:${API_PORT:-4010}/health" >/dev/null \
        && echo "  ✅ API /health" \
        || echo "  ⚠️  API /health failed"
    curl -sf "http://127.0.0.1:${WEB_PORT:-3010}/" >/dev/null \
        && echo "  ✅ Web" \
        || echo "  ⚠️  Web failed"
    curl -sf "http://127.0.0.1:${ADMIN_PORT:-3011}/" >/dev/null \
        && echo "  ✅ Admin" \
        || echo "  ⚠️  Admin failed"
}

deploy_maybe_prune_build_cache() {
    if [ "${PRUNE_BUILD_CACHE:-yes}" = "yes" ]; then
        echo "🧹 Pruning unused Docker build cache..."
        docker builder prune -f >/dev/null 2>&1 || true
    fi
}
