-- ============================================================
-- Migration: 20260102000000_fix_monthly_winner (IDEMPOTENT)
-- ============================================================
-- این migration برای رفع schema در دیتابیس‌هایی است که قبلاً با
-- ساختار قدیمی (winnerId واحد) ساخته شده‌اند.
--
-- در نسخه‌ی فعلی، init migration از قبل ساختار صحیح polymorphic
-- را می‌سازد، بنابراین این migration برای دیتابیس‌های جدید NO-OP است.
--
-- [QA Fix 2026-05-25] تمام عملیات‌ها idempotent شده‌اند (IF EXISTS / IF NOT EXISTS)
-- تا روی دیتابیس‌های جدید crash نکند.
-- ============================================================

-- ─── حذف ساختار قدیمی (در صورت وجود) ───────────────────────
ALTER TABLE "monthly_winners" DROP CONSTRAINT IF EXISTS "monthly_winners_winnerId_fkey";
ALTER TABLE "monthly_winners" DROP CONSTRAINT IF EXISTS "monthly_winners_year_month_type_winnerId_key";
ALTER TABLE "monthly_winners" DROP COLUMN IF EXISTS "winnerId";

-- ─── اضافه کردن ستون‌های جدید (در صورت عدم وجود) ────────────
ALTER TABLE "monthly_winners" ADD COLUMN IF NOT EXISTS "winnerUserId" INTEGER;
ALTER TABLE "monthly_winners" ADD COLUMN IF NOT EXISTS "winnerTeamId" INTEGER;
ALTER TABLE "monthly_winners" ADD COLUMN IF NOT EXISTS "winnerGameId" INTEGER;

-- ─── CHECK CONSTRAINT (idempotent با DROP + ADD) ─────────────
ALTER TABLE "monthly_winners" DROP CONSTRAINT IF EXISTS "monthly_winners_check_type";
ALTER TABLE "monthly_winners" ADD CONSTRAINT "monthly_winners_check_type"
  CHECK (
    (type = 'TOP_PLAYER' AND "winnerUserId" IS NOT NULL AND "winnerTeamId" IS NULL AND "winnerGameId" IS NULL) OR
    (type = 'TOP_TEAM'   AND "winnerTeamId" IS NOT NULL AND "winnerUserId" IS NULL AND "winnerGameId" IS NULL) OR
    (type = 'TOP_GAME'   AND "winnerGameId" IS NOT NULL AND "winnerUserId" IS NULL AND "winnerTeamId" IS NULL)
  );

-- ─── UNIQUE INDEX (idempotent) ───────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS "monthly_winners_year_month_type_key"
  ON "monthly_winners"("year", "month", "type");

-- ─── FK ها (با DROP + ADD برای idempotent) ───────────────────
ALTER TABLE "monthly_winners" DROP CONSTRAINT IF EXISTS "monthly_winners_winnerUserId_fkey";
ALTER TABLE "monthly_winners"
  ADD CONSTRAINT "monthly_winners_winnerUserId_fkey"
  FOREIGN KEY ("winnerUserId") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "monthly_winners" DROP CONSTRAINT IF EXISTS "monthly_winners_winnerTeamId_fkey";
ALTER TABLE "monthly_winners"
  ADD CONSTRAINT "monthly_winners_winnerTeamId_fkey"
  FOREIGN KEY ("winnerTeamId") REFERENCES "teams"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "monthly_winners" DROP CONSTRAINT IF EXISTS "monthly_winners_winnerGameId_fkey";
ALTER TABLE "monthly_winners"
  ADD CONSTRAINT "monthly_winners_winnerGameId_fkey"
  FOREIGN KEY ("winnerGameId") REFERENCES "games"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
