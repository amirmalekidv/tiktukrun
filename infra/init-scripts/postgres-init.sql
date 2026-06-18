-- ============================================================
-- TIK TAK RUN — PostgreSQL Initialization Script
-- این اسکریپت فقط یک بار هنگام اولین راه‌اندازی اجرا می‌شود
-- ============================================================

-- ایجاد extension های مورد نیاز
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- تنظیم timezone
SET timezone = 'Asia/Tehran';

-- لاگ راه‌اندازی
DO $$
BEGIN
  RAISE NOTICE '✅ TIK TAK RUN PostgreSQL initialized successfully';
  RAISE NOTICE '  Extensions: pgcrypto, citext, uuid-ossp';
  RAISE NOTICE '  Timezone: Asia/Tehran';
END $$;
