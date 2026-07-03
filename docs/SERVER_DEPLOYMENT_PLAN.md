# TIK TAK RUN — Server Deployment Plan

> **Server:** `185.250.249.187`  
> **Review date:** 2026-07-03 (updated deploy workflow)  
> **Stack:** MongoDB 7 (replica set) · Redis 7 · NestJS API · Next.js Web/Admin · Nginx (host or bundled)

---

## Table of contents

1. [Server review (live snapshot)](#1-server-review-live-snapshot)
2. [Go / no-go assessment](#2-go--no-go-assessment)
3. [Architecture overview](#3-architecture-overview)
4. [Deployment task plan](#4-deployment-task-plan)
5. [Environment configuration](#5-environment-configuration)
6. [Post-deploy verification](#6-post-deploy-verification)
7. [Ongoing operations](#7-ongoing-operations)
8. [Known gotchas](#8-known-gotchas)
9. [Execution checklist](#9-execution-checklist)

---



## 1. Server review (live snapshot)

SSH review performed on `root@185.250.249.187` (key-based auth, no password required).

### System


| Item       | Value                                                 |
| ---------- | ----------------------------------------------------- |
| Hostname   | `185`                                                 |
| OS         | Ubuntu **24.04.4 LTS** (Noble Numbat)                 |
| Kernel     | `6.8.0-124-generic` x86_64                            |
| CPU        | **8 vCPU**                                            |
| RAM        | **15 GiB** total (~13 GiB available)                  |
| Swap       | **2 GiB** (`/swapfile`, ~48 MiB used)                 |
| Disk (`/`) | **96 GB** total, **~50 GB used**, **~47 GB free (52%)** — cleaned 2026-07-03 |




### Software


| Item           | Status          |
| -------------- | --------------- |
| Docker         | ✅ `29.6.1`      |
| Docker Compose | ✅ `v5.2.0`      |
| Certbot (host) | ❌ Not installed |
| UFW firewall   | ✅ Active        |




### Listening ports (relevant)


| Port      | Process                           | Notes                                       |
| --------- | --------------------------------- | ------------------------------------------- |
| 22        | sshd                              | SSH                                         |
| 80        | `modiranet-nginx` (docker-proxy)  | **Already in use**                          |
| 443       | —                                 | Not bound on host (some apps use alt ports) |
| 3000      | node (host process)               | Dev/other service                           |
| 8095–8097 | moz-web-proxy, moz-admin, moz-api | Moz platform                                |
| 8091–8092 | quizbattle-nginx                  | QuizBattle                                  |
| 8443      | moz-web-proxy                     | Moz HTTPS                                   |




### Running containers (summary)

This is a **shared multi-app server**. Existing stacks include:

- **modiranet** — nginx on **port 80** (main host reverse proxy)
- **moz-platform** — web/admin/api on ports 8095–8097, 8443
- **quizbattle** — nginx on 8091–8092
- **aryana** — postgres + redis (localhost-bound)
- Other: meilisearch, mariadb, various frontends

**TIK TAK RUN is not yet deployed** — no `tiktakrun-`* containers or project directory found.

### Firewall (UFW)

Open ports include 22, 80, 443, and many app-specific ports (8091–8097, 5173, 8080, etc.).

### App directories found

```
/opt/quizbattle/deploy/
/home/root/webapp/modiranet/
/home/root/webapp/moz-platform/
/home/root/webapp/aryana/
/home/root/webapp/live/
/home/root/webapp/site_repo/
/root/modiranet_new/webapp/
```

No `/home/tiktakrun/tiktakrun` or similar path exists yet.

---



## 2. Go / no-go assessment


| Check                        | Result                          | Action required                                                                                           |
| ---------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------- |
| RAM (≥ 4 GB)                 | ✅ 15 GB                         | None                                                                                                      |
| CPU (≥ 2 vCPU)               | ✅ 8 vCPU                        | None                                                                                                      |
| Docker + Compose             | ✅ Installed                     | None                                                                                                      |
| Disk space                   | ✅ **~47 GB free (52% used)**    | Phase 1 cleanup done; `update.sh` auto-prunes build cache after each deploy |
| Port 80                      | ⚠️ **Taken by modiranet-nginx** | Use **`DEPLOY_MODE=shared`** + host nginx (see below) — do not start bundled nginx on 80 |
| Port 443                     | ✅ Free on host                  | Can be used if routing through existing nginx                                                             |
| TIK TAK RUN already deployed | ✅ Clean slate                   | Fresh install                                                                                             |
| Certbot                      | ❌ Not on host                   | Install before SSL, or use existing nginx + cert flow                                                     |
| DNS                          | ❓ Not verified from server      | Confirm A records point to `185.250.249.187` before SSL                                                   |




### Recommended deployment strategy for this server

**Use Option A (implemented in repo)** — shared VPS via `DEPLOY_MODE=shared`:

1. Set `DEPLOY_MODE=shared` in server `.env`.
2. Compose loads `docker-compose.shared.yml`, which **disables bundled nginx** (no port 80/443 conflict).
3. API / web / admin bind to `127.0.0.1:4000`, `3000`, `3001` by default in `docker-compose.yml`, and can be overridden via `API_PORT`, `WEB_PORT`, `ADMIN_PORT` in `.env` if one of those host ports is already occupied.
4. Add server blocks to **modiranet-nginx** using `infra/nginx/host/tiktakrun.conf.example`.
5. Obtain SSL certs via certbot on the host (or extend existing cert management).

**Other options (manual, not default):**

- **Option B** — bundled nginx on alternate ports (e.g. `8088:80`) + edge proxy.
- **Option C** — expose app ports via UFW (8098/8099) for quick testing only.

> Without `DEPLOY_MODE=shared`, the default `docker-compose.yml` binds nginx to `80:80` and **will conflict** with `modiranet-nginx`.

### Deploy & update workflow (scripts)

| Step | Where | Command |
| ---- | ----- | ------- |
| First install | Server | `SEED=yes bash infra/scripts/deploy.sh` |
| Every update | Server | `bash infra/scripts/update.sh` |
| Push + update | Local machine | `pnpm deploy:push` or `bash infra/scripts/push-update.sh` |

**Local config** — copy `.env.deploy.example` → `.env.deploy`:

```env
DEPLOY_SERVER=root@185.250.249.187
DEPLOY_PATH=/home/root/webapp/tiktakrun
SYNC_MODE=auto   # auto | git | rsync
```

`push-update.sh` behaviour:

- **`auto`** — if git working tree is clean → `git push` + server `update.sh`; else → rsync + `update.sh` with `GIT_PULL=no`
- **`git`** — always push then pull on server
- **`rsync`** — sync files (excludes `.env`, `node_modules`, uploads) then update without git pull

**What `update.sh` does on the server:**

1. Pre-update MongoDB backup (`backup.sh`)
2. `git pull` (unless `GIT_PULL=no`)
3. `docker compose build --pull api web admin`
4. Restart stack + `prisma db push`
5. Smoke checks on localhost ports
6. Prune Docker build cache (`PRUNE_BUILD_CACHE=yes` by default)

---



## 3. Architecture overview

Compose files:

- `docker-compose.yml` — base stack (all services)
- `docker-compose.shared.yml` — loaded when `DEPLOY_MODE=shared`; disables bundled nginx

```
mongo → mongo-init → api ← redis
                      ↑
              web, admin  (+ nginx only if DEPLOY_MODE=standalone)
```

On this server (`DEPLOY_MODE=shared`), public traffic flows:

```
Internet → modiranet-nginx (80/443) → 127.0.0.1:WEB_PORT / ADMIN_PORT / API_PORT → tiktakrun containers
```


| Service      | Image / build                   | Internal port | Purpose                                         |
| ------------ | ------------------------------- | ------------- | ----------------------------------------------- |
| `mongo`      | `mongo:7`                       | 27017         | MongoDB replica set `rs0` (Prisma transactions) |
| `mongo-init` | `mongo:7`                       | —             | One-shot `rs.initiate()`                        |
| `redis`      | `redis:7-alpine`                | 6379          | Cache / sessions                                |
| `api`        | `infra/docker/api.Dockerfile`   | 4000          | NestJS + Prisma                                 |
| `web`        | `infra/docker/web.Dockerfile`   | 3000          | Next.js public site                             |
| `admin`      | `infra/docker/admin.Dockerfile` | 3001          | Next.js admin dashboard                         |
| `nginx`      | `nginx:alpine`                  | 80, 443       | Reverse proxy (**standalone only**; disabled in shared mode) |




### Public URL model (from `.env.example`)

Subdomain-based routing via `infra/nginx/conf.d/default.conf`:


| URL                             | Backend                              |
| ------------------------------- | ------------------------------------ |
| `https://tiktakrun.ir`          | web:3000                             |
| `https://admin.tiktakrun.ir`    | admin:3001                           |
| `https://api.tiktakrun.ir`      | api:4000 (+ WebSocket `/socket.io/`) |
| `https://tiktakrun.ir/api/`     | api:4000 (also on main domain)       |
| `https://tiktakrun.ir/uploads/` | static files from `storage/uploads`  |




### Database notes

- MongoDB requires replica set `rs0` even for single-node (Prisma requirement).
- Schema sync uses `prisma db push` — not `prisma migrate deploy`.
- Production Mongo keyfile must be regenerated (see Phase 3).

---



## 4. Deployment task plan



### Phase 0 — Pre-flight (local + DNS)

- [ ] Confirm DNS A records → `185.250.249.187`:
  ```
  tiktakrun.ir
  www.tiktakrun.ir
  admin.tiktakrun.ir
  api.tiktakrun.ir
  ```
- [ ] Verify propagation: `dig +short tiktakrun.ir`
- [ ] Decide code delivery:
  - **Recommended:** `pnpm deploy:push` from local (auto git or rsync)
  - **Git only:** commit + push, then `bash infra/scripts/update.sh` on server
  - **Rsync only:** `SYNC_MODE=rsync bash infra/scripts/push-update.sh`
- [ ] Gather production credentials: SMS.ir, ZarinPal, domain email for certbot
- [ ] Set `DEPLOY_MODE=shared` in server `.env` (required on this VPS)
- [ ] Copy `.env.deploy.example` → `.env.deploy` on local machine



### Phase 1 — Server bootstrap

Most prerequisites are already met. Only needed steps:

```bash
ssh root@185.250.249.187

# Optional: create deploy user (recommended)
adduser --disabled-password --gecos "" tiktakrun
usermod -aG docker,sudo tiktakrun

# Install certbot if using host-level SSL
apt update && apt install -y certbot

# Ensure timezone
timedatectl set-timezone Asia/Tehran
```

Docker, UFW, and swap are already configured.

### Phase 2 — Deploy application code

```bash
ssh root@185.250.249.187
su - tiktakrun   # or stay as root under /home/root/webapp/

cd /home/root/webapp   # matches existing layout on this server
git clone <YOUR_REPO_URL> tiktakrun
cd tiktakrun
```

**From local machine (recommended for updates):**

```bash
cp .env.deploy.example .env.deploy   # once
pnpm deploy:push
```

**Manual rsync (first sync or without git):**

```bash
rsync -avz --exclude node_modules --exclude .git --exclude .env \
  /path/to/tiktakrun/ \
  root@185.250.249.187:/home/root/webapp/tiktakrun/
```



### Phase 3 — Environment configuration

```bash
cd /home/root/webapp/tiktakrun
cp .env.example .env
nano .env
```

**Required for this server** — add to `.env`:

```env
DEPLOY_MODE=shared
PROD_DOMAIN=tiktakrun.ir
# ... plus MONGO_PASSWORD, JWT secrets, SMS, ZarinPal, etc.
```

**Generate secrets:**

```bash
openssl rand -base64 48   # JWT_SECRET, JWT_REFRESH_SECRET
openssl rand -base64 32   # COOKIE_SECRET, MONGO_PASSWORD
```

**Regenerate MongoDB keyfile (required for production):**

```bash
openssl rand -base64 756 > infra/mongo/mongo-keyfile
chmod 400 infra/mongo/mongo-keyfile
chown 999:999 infra/mongo/mongo-keyfile
```

**Storage permissions:**

```bash
mkdir -p storage/uploads
chown -R 1001:1001 storage/
```

See [Section 5](#5-environment-configuration) for the full variable list.

### Phase 4 — Build and start services

```bash
chmod +x infra/scripts/*.sh infra/scripts/lib/*.sh

# First deploy with seed data (stack must not already be running):
SEED=yes bash infra/scripts/deploy.sh
```

`deploy.sh` detects `DEPLOY_MODE=shared` and starts mongo, redis, api, web, admin **without** bundled nginx.

Or manually:

```bash
docker compose -f docker-compose.yml -f docker-compose.shared.yml build --pull
docker compose -f docker-compose.yml -f docker-compose.shared.yml up -d mongo mongo-init redis api web admin
docker compose exec api npx prisma db push --skip-generate
docker compose exec api pnpm seed   # first time only
```

**Verify on server (localhost):**

```bash
docker compose -f docker-compose.yml -f docker-compose.shared.yml ps
curl -s http://127.0.0.1:${API_PORT:-4000}/health
curl -sI http://127.0.0.1:${WEB_PORT:-3000}
curl -sI http://127.0.0.1:${ADMIN_PORT:-3001}
```

> **Build time:** allow 15–30+ minutes on first build. Subsequent updates via `update.sh` rebuild only api/web/admin.



### Phase 5 — SSL and reverse proxy

**On this server — integrate with modiranet-nginx (shared mode):**

1. Copy/adapt `infra/nginx/host/tiktakrun.conf.example` into modiranet nginx config.
2. Point upstreams to the loopback ports configured in `.env` (`WEB_PORT`, `ADMIN_PORT`, `API_PORT`; defaults `3000`, `3001`, `4000`).
3. Set uploads alias to `/home/root/webapp/tiktakrun/storage/uploads/`.
4. Reload modiranet nginx: `docker exec modiranet-nginx nginx -s reload`
5. Run certbot on host for `tiktakrun.ir`, `admin.tiktakrun.ir`, `api.tiktakrun.ir`.

**If using bundled nginx on a dedicated VPS (`DEPLOY_MODE=standalone`):**

```bash
apt install -y certbot   # if not installed
sudo bash infra/scripts/ssl-setup.sh tiktakrun.ir admin@tiktakrun.ir
```

**External checks:**

```bash
curl -I https://tiktakrun.ir
curl -s https://api.tiktakrun.ir/health
curl -I https://admin.tiktakrun.ir
```



### Phase 6 — Post-deploy hardening

- [ ] Change default admin password (`SEED_SUPERADMIN_PASSWORD` in `.env` → login → change immediately)
- [ ] Set `SMS_MOCK_MODE=false` for real OTP
- [ ] Set `ZARINPAL_SANDBOX=false` and `PAYMENTS_MOCK_MODE=false` for real payments
- [ ] Enable daily backup cron (see [Section 7](#7-ongoing-operations))
- [ ] Run smoke tests (see [Section 6](#6-post-deploy-verification))

---



## 5. Environment configuration



### Required variables


| Variable                 | Example / note                                                                                                  |
| ------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `DEPLOY_MODE`            | `shared` on this VPS; `standalone` on dedicated server with bundled nginx                                     |
| `PROD_DOMAIN`            | `tiktakrun.ir`                                                                                                  |
| `MONGO_PASSWORD`         | Strong random password                                                                                          |
| `DATABASE_URL`           | `mongodb://tiktakrun:<password>@mongo:27017/tiktakrun_db?authSource=admin&replicaSet=rs0&directConnection=true` |
| `JWT_SECRET`             | `openssl rand -base64 48`                                                                                       |
| `JWT_REFRESH_SECRET`     | `openssl rand -base64 48`                                                                                       |
| `COOKIE_SECRET`          | `openssl rand -base64 32`                                                                                       |
| `WEB_URL`                | `https://tiktakrun.ir`                                                                                          |
| `ADMIN_URL`              | `https://admin.tiktakrun.ir`                                                                                    |
| `NEXT_PUBLIC_API_URL`    | `https://api.tiktakrun.ir/api/v1`                                                                               |
| `NEXT_PUBLIC_SOCKET_URL` | `wss://api.tiktakrun.ir`                                                                                        |
| `CORS_ORIGINS`           | `https://tiktakrun.ir,https://admin.tiktakrun.ir`                                                               |
| `SMS_IR_API_KEY`         | From sms.ir panel                                                                                               |
| `SMS_IR_TEMPLATE_ID`     | OTP verify template ID                                                                                          |
| `ZARINPAL_MERCHANT_ID`   | Production merchant ID                                                                                          |
| `ZARINPAL_CALLBACK_URL`  | `https://tiktakrun.ir/api/v1/payments/verify` (or api subdomain)                                                |




### Production flags

```env
SMS_MOCK_MODE=false
PAYMENTS_MOCK_MODE=false
ZARINPAL_SANDBOX=false
NODE_ENV=production
TZ=Asia/Tehran
```



### Build-time warning

`NEXT_PUBLIC_*` variables are **baked into Next.js images at build time**. After changing them in `.env`, rebuild:

```bash
bash infra/scripts/update.sh
# or rebuild frontends only after .env NEXT_PUBLIC_* change:
docker compose -f docker-compose.yml -f docker-compose.shared.yml build web admin
docker compose -f docker-compose.yml -f docker-compose.shared.yml up -d web admin
```

---



## 6. Post-deploy verification


| URL                                    | Expected result       |
| -------------------------------------- | --------------------- |
| `https://tiktakrun.ir`                 | Public homepage loads |
| `https://admin.tiktakrun.ir`           | Admin login page      |
| `https://api.tiktakrun.ir/health`      | `{"status":"ok",...}` |
| `https://api.tiktakrun.ir/api/v1/docs` | Swagger UI            |




### Functional smoke tests

- [ ] Admin OTP login (real SMS if `SMS_MOCK_MODE=false`)
- [ ] End-to-end booking flow
- [ ] WebSocket chat (DevTools → Network → WS on `api.tiktakrun.ir`)
- [ ] File upload (`/uploads/` served correctly)
- [ ] Wallet charge / ZarinPal payment (sandbox first, then production)
- [ ] Change superadmin password after first login



### Default seed credentials (change immediately)


| Field    | Value (from `.env.example`)                         |
| -------- | --------------------------------------------------- |
| Mobile   | `09120000001`                                       |
| Password | `SEED_SUPERADMIN_PASSWORD` (default `Admin@123456`) |


---



## 7. Ongoing operations



### Update deployment

**From local machine (recommended):**

```bash
pnpm deploy:push
# or: bash infra/scripts/push-update.sh
```

**On server only:**

```bash
cd /home/root/webapp/tiktakrun
bash infra/scripts/update.sh
```

**Update script options (env vars):**

| Variable | Default | Description |
| -------- | ------- | ----------- |
| `GIT_PULL` | `yes` | Set `no` after rsync (push-update does this automatically) |
| `GIT_BRANCH` | current branch | Branch to pull |
| `SKIP_BACKUP` | `0` | Set `1` to skip pre-update backup |
| `PRUNE_BUILD_CACHE` | `yes` | Set `no` to keep Docker build cache |

Flow: backup → git pull → build api/web/admin → restart → `prisma db push` → smoke tests → prune build cache.

### Manual service restart

```bash
docker compose restart api
docker compose restart web admin nginx
```



### Logs

```bash
docker compose logs -f api
docker compose logs --tail=100 web
docker compose ps
docker stats
```



### Daily backup cron

```bash
mkdir -p /var/backups/tiktakrun
( crontab -l 2>/dev/null; echo "0 3 * * * cd /home/root/webapp/tiktakrun && bash infra/scripts/backup.sh >> /var/log/tiktakrun-backup.log 2>&1" ) | crontab -
```

Manual backup:

```bash
bash infra/scripts/backup.sh
ls -lh /var/backups/tiktakrun/
```



### Disk maintenance

```bash
df -h
docker system df
# Careful on shared server — only prune tiktakrun-unused resources:
docker image prune -f
```

---



## 8. Known gotchas



### Outdated root docs

`QUICK_START.md` may still reference PostgreSQL. This version uses **MongoDB** and `prisma db push`. Prefer:

- `docs/SERVER_DEPLOYMENT_PLAN.md` — server-specific plan for `185.250.249.187`
- `infra/scripts/deploy.sh` — first install
- `infra/scripts/update.sh` — server updates
- `infra/scripts/push-update.sh` / `pnpm deploy:push` — local → server
- `.env.example`, `.env.deploy.example`



### Nginx config overlap

Both files are loaded by `infra/nginx/nginx.conf`:

- `infra/nginx/conf.d/default.conf` — **subdomain model** (correct for `.env.example`)
- `infra/nginx/sites/tiktakrun.conf` — path-based `/admin/` routing, certs under `/etc/nginx/ssl/`

If nginx fails to start or routing is wrong, remove or disable `sites/tiktakrun.conf` and use `default.conf` only.

### Port 80 conflict on this server

`modiranet-nginx` binds `0.0.0.0:80`. Set **`DEPLOY_MODE=shared`** in `.env` so `docker-compose.shared.yml` disables bundled nginx. Route traffic via `infra/nginx/host/tiktakrun.conf.example`.

### ssl-setup.sh hardcoded paths

Renewal cron in `infra/scripts/ssl-setup.sh` assumes project at `/home/tiktakrun`. Update if installed under `/home/root/webapp/tiktakrun`. On shared mode, SSL is managed on host/modiranet nginx instead.

### Low disk space

`update.sh` runs `docker builder prune -f` after each deploy. If disk fills up, run `docker system df` and prune manually — avoid `docker system prune -a` on this shared server without reviewing other apps.

---



## 9. Execution checklist


| #   | Task                                           | Status            |
| --- | ---------------------------------------------- | ----------------- |
| 1   | Review server snapshot (Section 1)             | ✅ Done 2026-07-03 |
| 2   | Set `DEPLOY_MODE=shared` + nginx integration   | ⬜                 |
| 3   | Confirm DNS → `185.250.249.187`                | ⬜                 |
| 4   | Free disk space if needed                      | ✅ Done 2026-07-03 |
| 5   | Sync code to `/home/root/webapp/tiktakrun`     | ⬜                 |
| 6   | Create `.env` with production secrets          | ⬜                 |
| 7   | Regenerate Mongo keyfile + storage permissions | ⬜                 |
| 8   | Copy `.env.deploy` on local machine            | ⬜                 |
| 9   | `SEED=yes bash infra/scripts/deploy.sh`        | ⬜                 |
| 10  | Add modiranet nginx + SSL (Phase 5)            | ⬜                 |
| 11  | Smoke tests (Section 6)                        | ⬜                 |
| 12  | Change admin password + enable backup cron     | ⬜                 |


---



## Quick reference commands

```bash
# Connect
ssh root@185.250.249.187

# First deploy (on server)
cd /home/root/webapp/tiktakrun
SEED=yes bash infra/scripts/deploy.sh

# Update from local machine
pnpm deploy:push

# Update on server only
bash infra/scripts/update.sh

# Health (localhost on server)
docker compose -f docker-compose.yml -f docker-compose.shared.yml ps
curl -s http://127.0.0.1:4000/health

# Logs
docker compose logs -f api
```

---

*Generated from codebase review of* `docker-compose.yml`*,* `docker-compose.shared.yml`*,* `infra/scripts/deploy.sh`*,* `infra/scripts/update.sh`*,* `infra/scripts/push-update.sh`*,* `.env.example`*, and live SSH inspection of* `185.250.249.187`*.*
