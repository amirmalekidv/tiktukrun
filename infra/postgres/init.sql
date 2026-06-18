-- TIK TAK RUN — PostgreSQL initialization
-- این فایل فقط در اولین راه‌اندازی اجرا می‌شود

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Set timezone
SET timezone = 'Asia/Tehran';

-- Grant privileges (در صورتی که user از env بیاید)
-- GRANT ALL PRIVILEGES ON DATABASE tiktakrun TO tiktak;
