#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# TIK TAK RUN — Push code to server and run update
# ═══════════════════════════════════════════════════════════════════════════
# Run from your local machine after committing changes.
#
# Usage:
#   bash infra/scripts/push-update.sh
#
# Config (env or .env.deploy in project root):
#   DEPLOY_SERVER=root@185.250.249.187
#   DEPLOY_PATH=/home/root/webapp/tiktakrun
#   SYNC_MODE=auto|git|rsync   (default: auto)
# ═══════════════════════════════════════════════════════════════════════════
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

if [ -f "$PROJECT_ROOT/.env.deploy" ]; then
    set -a
    # shellcheck disable=SC1091
    source "$PROJECT_ROOT/.env.deploy"
    set +a
fi

DEPLOY_SERVER="${DEPLOY_SERVER:-root@185.250.249.187}"
DEPLOY_PATH="${DEPLOY_PATH:-/home/root/webapp/tiktakrun}"
SYNC_MODE="${SYNC_MODE:-auto}"
GIT_REMOTE="${GIT_REMOTE:-origin}"

echo "╔══════════════════════════════════════════════════════════╗"
echo "║       TIK TAK RUN — Push & Update Server                 ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo "  Server: $DEPLOY_SERVER"
echo "  Path:   $DEPLOY_PATH"
echo ""

if [ "$SYNC_MODE" = "auto" ]; then
    if [ -d .git ] && git diff --quiet && git diff --cached --quiet; then
        SYNC_MODE=git
    else
        SYNC_MODE=rsync
    fi
fi

echo "  Sync mode: $SYNC_MODE"
echo ""

run_remote_update() {
    local git_pull="${1:-yes}"
    ssh -o BatchMode=yes "$DEPLOY_SERVER" "cd '$DEPLOY_PATH' && GIT_PULL=$git_pull bash infra/scripts/update.sh"
}

case "$SYNC_MODE" in
    git)
        if [ ! -d .git ]; then
            echo "❌ Not a git repo — use SYNC_MODE=rsync"
            exit 1
        fi
        echo "📤 Pushing to $GIT_REMOTE..."
        git push "$GIT_REMOTE" HEAD
        echo "🚀 Running update on server..."
        run_remote_update yes
        ;;
    rsync)
        echo "📦 Rsyncing project to server..."
        rsync -avz --delete \
            --exclude node_modules \
            --exclude .git \
            --exclude .env \
            --exclude .env.local \
            --exclude .env.deploy \
            --exclude storage/uploads \
            --exclude storage/backups \
            --exclude .next \
            --exclude dist \
            --exclude coverage \
            --exclude .turbo \
            "$PROJECT_ROOT/" "$DEPLOY_SERVER:$DEPLOY_PATH/"
        echo "🚀 Running update on server..."
        run_remote_update no
        ;;
    *)
        echo "❌ Unknown SYNC_MODE: $SYNC_MODE (use auto, git, or rsync)"
        exit 1
        ;;
esac

echo ""
echo "✅ Done — server updated."
