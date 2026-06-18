# MongoDB Replica Set — راهنمای راه‌اندازی

این پوشه شامل فایل‌های لازم برای اجرای MongoDB به‌صورت **Replica Set (rs0)** است.
Prisma برای پشتیبانی از transaction روی MongoDB به replica set نیاز دارد (حتی تک‌نودی).

## فایل‌ها

| فایل | توضیح |
|------|-------|
| `init-replica.sh` | اسکریپت راه‌اندازی خودکار replica set (سرویس `mongo-init`) |
| `mongo-keyfile` | کلید احراز هویت داخلی بین اعضای replica set |

## ⚠️ تولید keyfile امن در production

فایل `mongo-keyfile` موجود فقط یک نمونه است. **حتماً در سرور production یک کلید جدید بسازید:**

```bash
openssl rand -base64 756 > infra/mongo/mongo-keyfile
chmod 400 infra/mongo/mongo-keyfile
# مالکیت باید با کاربر mongodb داخل کانتینر (uid 999) سازگار باشد:
sudo chown 999:999 infra/mongo/mongo-keyfile
```

## راه‌اندازی

با `docker compose up -d` به‌صورت خودکار انجام می‌شود:
1. سرویس `mongo` با `--replSet rs0 --keyFile` بالا می‌آید.
2. سرویس `mongo-init` یک‌بار اجرا می‌شود و `rs.initiate()` را صدا می‌زند.
3. سرویس `api` فقط پس از موفقیت `mongo-init` شروع می‌شود.

## بررسی وضعیت

```bash
docker compose exec mongo mongosh -u tiktakrun -p "$MONGO_PASSWORD" --authenticationDatabase admin --eval "rs.status()"
```

## اعمال اسکیما (به‌جای migrate)

MongoDB از `prisma migrate` پشتیبانی نمی‌کند. به‌جای آن:

```bash
docker compose exec api pnpm --filter @tiktakrun/api exec prisma db push
docker compose exec api pnpm --filter @tiktakrun/api run seed   # داده اولیه
```
