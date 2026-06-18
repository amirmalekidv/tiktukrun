# ⚡ QUICK_START — راه‌اندازی در ۵ دقیقه

> اگر فقط می‌خواهید پروژه را روی یک سرور Ubuntu بالا بیاورید، این فایل کافی است.

برای جزئیات بیشتر → [`DEPLOYMENT.md`](./DEPLOYMENT.md)

---

## 🚀 ۵ گام برای بالا آوردن TIK TAK RUN

### 1️⃣ نصب پیش‌نیازها روی سرور (Ubuntu 22.04)

```bash
ssh root@<SERVER_IP>

# همه چیز در یک خط:
apt update && apt install -y docker.io docker-compose-v2 git certbot ufw && \
ufw allow 22,80,443/tcp && ufw --force enable && \
timedatectl set-timezone Asia/Tehran && \
adduser --disabled-password --gecos "" tiktakrun && \
usermod -aG docker tiktakrun
```

### 2️⃣ دانلود کد + تنظیم .env

```bash
su - tiktakrun
cd ~
git clone <YOUR_REPO_URL> tiktakrun   # یا unzip از ZIP
cd tiktakrun

# تولید secrets با یک خط:
cp .env.example .env
sed -i "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=' | head -c 32)|" .env
sed -i "s|JWT_SECRET=.*|JWT_SECRET=$(openssl rand -base64 48)|" .env
sed -i "s|JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=$(openssl rand -base64 48)|" .env
sed -i "s|COOKIE_SECRET=.*|COOKIE_SECRET=$(openssl rand -base64 32)|" .env

# سپس DATABASE_URL را با همان POSTGRES_PASSWORD آپدیت کنید + دامنه واقعی:
nano .env
```

⚠️ **در `.env` این موارد باید تنظیم شوند:**
- `DATABASE_URL` (با POSTGRES_PASSWORD هماهنگ)
- `PROD_DOMAIN` (مثل `tiktakrun.ir`)
- `WEB_URL`, `ADMIN_URL`, `NEXT_PUBLIC_*_URL` (با دامنه شما)
- `SMSIR_API_KEY` + `SMSIR_LINE_NUMBER` + `SMSIR_TEMPLATE_ID_OTP` (از sms.ir)
- `ZARINPAL_MERCHANT_ID` (از zarinpal.com)
- `ZARINPAL_CALLBACK_URL` (با دامنه)

### 3️⃣ DNS را تنظیم کنید

در پنل دامنه‌تان، این رکوردها را اضافه کنید:

```
A    tiktakrun.ir         <SERVER_IP>
A    www.tiktakrun.ir     <SERVER_IP>
A    admin.tiktakrun.ir   <SERVER_IP>
A    api.tiktakrun.ir     <SERVER_IP>
```

منتظر propagation شوید (5-30 دقیقه). تست:
```bash
dig +short tiktakrun.ir
```

### 4️⃣ بالا آوردن سرویس‌ها + Migration + Seed

```bash
chmod +x infra/scripts/*.sh
docker compose build --pull
docker compose up -d

# منتظر postgres ready
sleep 30

# Migration
docker compose exec api npx prisma migrate deploy

# Seed (فقط بار اول)
docker compose exec api pnpm seed

# تست
curl http://localhost:4000/health
```

### 5️⃣ SSL + بکاپ خودکار

```bash
# SSL با Let's Encrypt
sudo bash infra/scripts/ssl-setup.sh tiktakrun.ir admin@tiktakrun.ir

# Cron بکاپ روزانه (3AM)
( crontab -l 2>/dev/null; echo "0 3 * * * cd /home/tiktakrun/tiktakrun && bash infra/scripts/backup.sh" ) | crontab -
```

---

## ✅ تست نهایی

اگر همه چیز خوب پیش رفت:

| URL | باید چه پاسخی بدهد |
|-----|--------------------|
| `https://tiktakrun.ir` | صفحه اصلی TIK TAK RUN |
| `https://admin.tiktakrun.ir` | صفحه login ادمین |
| `https://api.tiktakrun.ir/health` | `{"status":"ok",...}` |
| `https://api.tiktakrun.ir/api/v1/docs` | Swagger UI |

---

## 🔐 اولین login

1. برو به `https://admin.tiktakrun.ir`
2. موبایل: `09120000001`
3. پسورد: مقدار `SEED_SUPERADMIN_PASSWORD` در `.env`
4. **بلافاصله** پسورد را تغییر بدهید (Settings → Security)

---

## 🆘 اگر مشکلی پیش آمد

```bash
# لاگ‌ها
docker compose logs -f api
docker compose logs -f web
docker compose logs -f admin

# وضعیت
docker compose ps

# restart
docker compose restart <service>

# همه چیز را پاک و دوباره start
docker compose down
docker compose up -d
```

برای troubleshooting کامل → [`DEPLOYMENT.md`](./DEPLOYMENT.md) → بخش Troubleshooting

---

## 📞 پشتیبانی

اگر باز هم مشکل بود، با تیم توسعه تماس بگیرید.

**موفق باشید! 🚀**
