#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# TIK TAK RUN — Let's Encrypt SSL Setup (Certbot)
# ═══════════════════════════════════════════════════════════════════════════
# Usage: sudo bash ssl-setup.sh tiktakrun.ir admin@tiktakrun.ir
# ═══════════════════════════════════════════════════════════════════════════
set -euo pipefail

DOMAIN="${1:-}"
EMAIL="${2:-admin@${DOMAIN:-tiktakrun.ir}}"

if [ -z "$DOMAIN" ]; then
    echo "Usage: $0 <domain> [admin-email]"
    echo "Example: sudo bash ssl-setup.sh tiktakrun.ir admin@tiktakrun.ir"
    exit 1
fi

echo "Setting up SSL for: $DOMAIN, www.$DOMAIN, admin.$DOMAIN, api.$DOMAIN"
echo "Email: $EMAIL"
echo ""

# ─── Install certbot if missing ───────────────────────────────────────────
if ! command -v certbot >/dev/null 2>&1; then
    echo "Installing certbot..."
    apt-get update -y
    apt-get install -y certbot
fi

# ─── Stop nginx container during cert issuance ────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

echo "Stopping nginx container temporarily..."
docker compose stop nginx 2>/dev/null || true

# ─── Get certificates (standalone mode) ───────────────────────────────────
certbot certonly --standalone \
    --non-interactive --agree-tos \
    --email "$EMAIL" \
    -d "$DOMAIN" \
    -d "www.$DOMAIN" \
    -d "admin.$DOMAIN" \
    -d "api.$DOMAIN" \
    --preferred-challenges http

echo "Restarting nginx..."
docker compose up -d nginx

# ─── Setup auto-renewal ───────────────────────────────────────────────────
RENEWAL_CRON="/etc/cron.d/tiktakrun-certbot"
cat > "$RENEWAL_CRON" <<'EOF'
# Renew Let's Encrypt certificates every day at 3:30 AM
30 3 * * * root certbot renew --quiet --post-hook "cd /home/tiktakrun && docker compose restart nginx"
EOF
chmod 644 "$RENEWAL_CRON"

echo ""
echo "SSL setup complete!"
echo "  Certificates: /etc/letsencrypt/live/$DOMAIN/"
echo "  Auto-renewal cron: $RENEWAL_CRON"
echo ""
echo "Test with: openssl s_client -connect $DOMAIN:443 -servername $DOMAIN"
