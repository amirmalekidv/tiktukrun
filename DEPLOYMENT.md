# 🚀 راهنمای دیپلوی TIK TAK RUN روی VPS Ubuntu

> راهنمای کامل و گام‌به‌گام برای دیپلوی پروژه TIK TAK RUN روی سرور Ubuntu 22.04 LTS.
> برنامه‌نویس فقط نیاز به اجرای دستورات این فایل دارد.

---

## 📋 فهرست

1. [پیش‌نیازهای VPS](#1-پیش-نیازهای-vps)
2. [نصب اولیه سرور](#2-نصب-اولیه-سرور)
3. [دیپلوی پروژه](#3-دیپلوی-پروژه)
4. [SSL و دامنه](#4-ssl-و-دامنه)
5. [بکاپ خودکار](#5-بکاپ-خودکار)
6. [آپدیت و نگهداری](#6-آپدیت-و-نگهداری)
7. [مانیتورینگ و لاگ‌ها](#7-مانیتورینگ-و-لاگ-ها)
8. [Troubleshooting](#8-troubleshooting)
9. [چک‌لیست نهایی](#9-چک-لیست-نهایی)

---

## 1. پیش‌نیازهای VPS

| ویژگی | حداقل | پیشنهادی |
|-------|------|----------|
| OS | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |
| RAM | 4 GB | 8 GB |
| CPU | 2 vCPU | 4 vCPU |
| Disk | 50 GB SSD | 100 GB SSD |
| پهنای باند | 1 TB / ماه | نامحدود |

**دامنه:** قبل از شروع، DNS رکورد `A` تنظیم کنید:
```
tiktakrun.ir         A    <SERVER_IP>
www.tiktakrun.ir     A    <SERVER_IP>
admin.tiktakrun.ir   A    <SERVER_IP>
api.tiktakrun.ir     A    <SERVER_IP>
```

---

## 2. نصب اولیه سرور

### اتصال SSH

```bash
ssh root@<SERVER_IP>
```

### آپدیت سیستم و نصب ابزارها

```bash
apt update && apt upgrade -y
apt install -y docker.io docker-compose-v2 git curl wget ufw certbot \
               htop tmux nano vim sudo unzip jq fail2ban
systemctl enable --now docker
```

### تنظیم timezone

```bash
timedatectl set-timezone Asia/Tehran
```

### فعال‌سازی فایروال

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp     # SSH
ufw allow 80/tcp     # HTTP
ufw allow 443/tcp    # HTTPS
ufw enable
ufw status
```

### تنظیم Fail2Ban (محافظت SSH)

```bash
cat > /etc/fail2ban/jail.local << 'EOF'
[sshd]
enabled = true
port = ssh
maxretry = 3
bantime = 1h
findtime = 10m
EOF
systemctl restart fail2ban
```

### ایجاد کاربر deploy (پیشنهادی)

```bash
adduser tiktakrun
usermod -aG docker,sudo tiktakrun
su - tiktakrun
```

از این به بعد همه دستورات با کاربر `tiktakrun` اجرا می‌شود.

---

## 3. دیپلوی پروژه

### 3.1 دانلود کد

```bash
cd ~
# اگر از git استفاده می‌کنید:
git clone <YOUR_REPO_URL> tiktakrun
# یا اگر zip تحویل گرفته‌اید:
unzip tiktakrun-FINAL-v1.0.0.zip -d tiktakrun
cd tiktakrun
```

### 3.2 تنظیم متغیرهای محیطی

```bash
cp .env.example .env
nano .env
```

**⚠️ متغیرهای الزامی که باید پر کنید:**

```env
# Domain
PROD_DOMAIN=tiktakrun.ir

# Database - رمز قوی
POSTGRES_PASSWORD=<رمز_قوی_حداقل_۱۶_کاراکتر>
DATABASE_URL=postgresql://tiktakrun:<همان_رمز>@postgres:5432/tiktakrun_db?schema=public

# JWT - حداقل ۳۲ کاراکتر تصادفی
JWT_SECRET=<openssl rand -base64 48>
JWT_REFRESH_SECRET=<openssl rand -base64 48>
COOKIE_SECRET=<openssl rand -base64 32>

# Public URLs
WEB_URL=https://tiktakrun.ir
ADMIN_URL=https://admin.tiktakrun.ir
NEXT_PUBLIC_API_URL=https://api.tiktakrun.ir/api/v1
NEXT_PUBLIC_SOCKET_URL=wss://api.tiktakrun.ir

# SMS.ir
SMS_MOCK_MODE=false
SMSIR_API_KEY=<کلید_از_sms.ir>
SMSIR_LINE_NUMBER=<شماره_خط>
SMSIR_TEMPLATE_ID_OTP=<شناسه_الگوی_OTP>

# ZarinPal
ZARINPAL_SANDBOX=false
ZARINPAL_MERCHANT_ID=<شناسه_۳۶_کاراکتری>
ZARINPAL_CALLBACK_URL=https://tiktakrun.ir/api/v1/payments/verify
```

**نکته امنیتی:** برای تولید secrets از این استفاده کنید:
```bash
openssl rand -base64 48   # برای JWT_SECRET، JWT_REFRESH_SECRET
openssl rand -base64 32   # برای COOKIE_SECRET، POSTGRES_PASSWORD
```

### 3.3 ساخت تصاویر و بالا آوردن سرویس‌ها

```bash
# مجوز اسکریپت‌ها
chmod +x infra/scripts/*.sh

# Build و Up
docker compose build --pull
docker compose up -d

# منتظر شدن تا postgres آماده شود
sleep 30
docker compose ps
```

### 3.4 اجرای migration و seed

```bash
# Migration
docker compose exec api npx prisma migrate deploy

# Seed داده‌های اولیه (فقط بار اول)
docker compose exec api pnpm seed
```

### 3.5 تست اولیه

```bash
# Health check
curl http://localhost:4000/health

# باید پاسخ JSON بدهد
```

---

## 4. SSL و دامنه

### 4.1 دریافت گواهی SSL با Let's Encrypt

```bash
sudo bash infra/scripts/ssl-setup.sh tiktakrun.ir admin@tiktakrun.ir
```

این اسکریپت:
1. certbot را نصب می‌کند (اگر نباشد)
2. nginx را موقت متوقف می‌کند
3. گواهی برای 4 ساب‌دامنه می‌گیرد: `tiktakrun.ir`, `www.tiktakrun.ir`, `admin.tiktakrun.ir`, `api.tiktakrun.ir`
4. cron job برای auto-renewal تنظیم می‌کند

### 4.2 تأیید SSL

```bash
# تست از داخل سرور
curl -I https://tiktakrun.ir

# تست از بیرون (با مرورگر):
# https://tiktakrun.ir         → سایت اصلی
# https://admin.tiktakrun.ir   → داشبورد ادمین
# https://api.tiktakrun.ir/api/v1/docs  → Swagger
```

---

## 5. بکاپ خودکار

### 5.1 تست دستی بکاپ

```bash
bash infra/scripts/backup.sh
ls -lh /var/backups/tiktakrun/
```

### 5.2 cron برای بکاپ روزانه

```bash
crontab -e
```

اضافه کنید:
```
# بکاپ روزانه ساعت ۳ بامداد
0 3 * * * cd /home/tiktakrun/tiktakrun && bash infra/scripts/backup.sh >> /var/log/tiktakrun-backup.log 2>&1
```

### 5.3 تست restore

```bash
# لیست بکاپ‌های موجود
ls -lh /var/backups/tiktakrun/

# بازیابی (نیاز به تأیید با تایپ RESTORE)
bash infra/scripts/restore.sh /var/backups/tiktakrun/db_YYYYMMDD_HHMMSS.sql.gz
```

---

## 6. آپدیت و نگهداری

### آپدیت پروژه

```bash
cd ~/tiktakrun
bash infra/scripts/update.sh
```

این اسکریپت:
1. بکاپ pre-update می‌گیرد
2. `git pull` می‌کند (اگر repo git باشد)
3. images را rebuild می‌کند
4. migration اجرا می‌کند
5. سرویس‌ها را restart می‌کند

### restart دستی یک سرویس

```bash
docker compose restart api
docker compose restart web
docker compose restart admin
docker compose restart nginx
```

---

## 7. مانیتورینگ و لاگ‌ها

### لاگ‌های real-time

```bash
# همه سرویس‌ها
docker compose logs -f

# فقط API
docker compose logs -f api

# فقط ۱۰۰ خط آخر
docker compose logs --tail=100 api
```

### وضعیت سرویس‌ها

```bash
docker compose ps
docker stats   # CPU/Memory live
```

### Health checks

```bash
curl https://api.tiktakrun.ir/health
curl https://tiktakrun.ir
curl https://admin.tiktakrun.ir
```

### Disk usage

```bash
df -h
docker system df
# پاکسازی images قدیمی:
docker system prune -a --volumes -f
```

---

## 8. Troubleshooting

| مشکل | تشخیص | راه‌حل |
|------|-------|--------|
| `502 Bad Gateway` | `docker compose ps` بررسی وضعیت API | `docker compose restart api` |
| `Database connection error` | `docker compose logs postgres` | چک کنید `POSTGRES_PASSWORD` در `.env` با URL هماهنگ باشد |
| `Migration failed` | `docker compose logs api` | `docker compose exec api npx prisma migrate resolve --rolled-back <migration>` |
| `SSL renewal fail` | `certbot certificates` | `certbot renew --dry-run` |
| `Out of disk` | `df -h` | `docker system prune -af && journalctl --vacuum-time=7d` |
| `OTP نمی‌رسد` | `docker compose logs api \| grep SMS` | کلید SMS.ir و `SMS_MOCK_MODE=false` |
| `ZarinPal verify fail` | `docker compose logs api \| grep -i zarin` | `ZARINPAL_CALLBACK_URL` باید HTTPS و مطابق merchant باشد |
| `Permission denied uploads` | `ls -la storage/uploads` | `sudo chown -R 1001:1001 storage/` |
| `Socket.io disconnect` | DevTools console | nginx upstream timeout افزایش (در `conf.d/default.conf`) |

---

## 9. چک‌لیست نهایی

قبل از تحویل به مشتری/راه‌اندازی production:

### امنیتی
- [ ] همه secret ها در `.env` تغییر داده شده (نه از example)
- [ ] `SEED_SUPERADMIN_PASSWORD` بعد از اولین login عوض شد
- [ ] فایروال (ufw) فقط 22, 80, 443 باز است
- [ ] Fail2ban فعال است
- [ ] SSL با Let's Encrypt تنظیم شده
- [ ] `SMS_MOCK_MODE=false` در production
- [ ] `ZARINPAL_SANDBOX=false` در production

### عملکردی
- [ ] `https://tiktakrun.ir` بالا می‌آید
- [ ] `https://admin.tiktakrun.ir` با حساب SuperAdmin login شد
- [ ] OTP واقعی به موبایل می‌رسد
- [ ] ZarinPal sandbox/real تست شد
- [ ] رزرو End-to-End کار می‌کند
- [ ] Socket.io chat کار می‌کند (DevTools → Network → WS)
- [ ] فایل آپلود (تصویر بازی) کار می‌کند
- [ ] Swagger `/api/v1/docs` در دسترس است

### نگهداری
- [ ] cron برای بکاپ روزانه فعال است
- [ ] restore تست شد
- [ ] لاگ rotation تنظیم شده
- [ ] alerting برای 5xx errors (اختیاری)
- [ ] Sentry DSN ست شده (اختیاری)

### کارفرما
- [ ] لوگو/favicon آپلود شد (Settings → Branding)
- [ ] Branding تنظیم شد (نام برند، آدرس، شماره)
- [ ] شعب واقعی اضافه شد
- [ ] بازی‌های واقعی با تصاویر اضافه شد
- [ ] قیمت‌ها و discount codes تست شد

---

## 🆘 تماس اضطراری

اگر در دیپلوی به مشکلی برخوردید:
1. اول `docker compose logs <service>` را بررسی کنید
2. سپس [`QA_REPORT.md`](./QA_REPORT.md) و [`Troubleshooting`](#8-troubleshooting) را ببینید
3. در نهایت با تیم توسعه تماس بگیرید (اطلاعات تماس در `DELIVERY_REPORT.md`)

**موفق باشید! 🚀**
