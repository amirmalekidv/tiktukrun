-- ============================================================
-- TIK TAK RUN — Sample Queries for Testing & Analytics
-- ============================================================
-- برای اجرا: psql -d tiktakrun -f prisma/scripts/sample-queries.sql
-- یا: wrangler d1 execute webapp-production --local --file=./prisma/scripts/sample-queries.sql
-- ============================================================

-- ■ ۱. آمار کلی دیتابیس ──────────────────────────────────────

SELECT
  (SELECT COUNT(*) FROM users)              AS total_users,
  (SELECT COUNT(*) FROM bookings)           AS total_bookings,
  (SELECT COUNT(*) FROM games)              AS total_games,
  (SELECT COUNT(*) FROM branches)           AS total_branches,
  (SELECT COUNT(*) FROM game_reviews)       AS total_reviews,
  (SELECT COUNT(*) FROM transactions)       AS total_transactions,
  (SELECT COUNT(*) FROM player_ratings)     AS total_player_ratings,
  (SELECT COUNT(*) FROM invite_usages)      AS total_invite_usages,
  (SELECT COUNT(*) FROM monthly_winners)    AS total_monthly_winners;

-- ■ ۲. کاربران فعال به تفکیک نقش ──────────────────────────────

SELECT
  ura.role,
  COUNT(DISTINCT u.id) AS user_count
FROM users u
JOIN user_role_assignments ura ON ura."userId" = u.id
WHERE u."isActive" = true
GROUP BY ura.role
ORDER BY user_count DESC;

-- ■ ۳. بازی‌های برتر بر اساس رتبه سایت ────────────────────────

SELECT
  g.title,
  g.slug,
  c.name AS category,
  b.name AS branch,
  g."siteRank",
  g."userRankCached",
  g."totalReviews",
  g."pricePerPerson",
  g."isFeatured"
FROM games g
JOIN categories c ON c.id = g."categoryId"
JOIN branches b ON b.id = g."branchId"
WHERE g."isActive" = true
ORDER BY g."siteRank" DESC
LIMIT 10;

-- ■ ۴. رزروهای ۷ روز اخیر به تفکیک وضعیت ──────────────────────

SELECT
  status,
  COUNT(*) AS count,
  SUM("totalAmount") AS total_revenue
FROM bookings
WHERE "createdAt" >= NOW() - INTERVAL '7 days'
GROUP BY status
ORDER BY count DESC;

-- ■ ۵. کاربران با بیشترین XP (لیدربورد) ────────────────────────

SELECT
  u.id,
  u."fullName",
  u.nickname,
  p.xp,
  p."levelId",
  l.name AS level_name,
  l.tier,
  p."successfulBookings",
  p."totalSpent"
FROM users u
JOIN profiles p ON p."userId" = u.id
JOIN levels l ON l.id = p."levelId"
WHERE u."isActive" = true AND u."isBanned" = false
ORDER BY p.xp DESC
LIMIT 20;

-- ■ ۶. درآمد روزانه ۳۰ روز اخیر ────────────────────────────────

SELECT
  DATE("createdAt") AS date,
  COUNT(*) AS bookings_count,
  SUM("totalAmount") AS daily_revenue
FROM bookings
WHERE
  status IN ('COMPLETED', 'CONFIRMED')
  AND "createdAt" >= NOW() - INTERVAL '30 days'
GROUP BY DATE("createdAt")
ORDER BY date DESC;

-- ■ ۷. محبوب‌ترین بازی‌ها (رزرو بیشتر) ─────────────────────────

SELECT
  g.title,
  g.slug,
  COUNT(b.id) AS booking_count,
  SUM(b."totalAmount") AS total_revenue,
  AVG(r.rating) AS avg_rating,
  COUNT(DISTINCT r.id) AS review_count
FROM games g
LEFT JOIN bookings b ON b."gameId" = g.id AND b.status = 'COMPLETED'
LEFT JOIN game_reviews r ON r."gameId" = g.id AND r."isApproved" = true
GROUP BY g.id, g.title, g.slug
ORDER BY booking_count DESC
LIMIT 10;

-- ■ ۸. بخش‌بندی کاربران بر اساس سطح هزینه ──────────────────────

SELECT
  CASE
    WHEN p."totalSpent" = 0             THEN 'بدون خرید'
    WHEN p."totalSpent" < 500000        THEN 'کم‌خرید'
    WHEN p."totalSpent" < 2000000       THEN 'متوسط'
    WHEN p."totalSpent" < 5000000       THEN 'پرخرید'
    ELSE 'VIP'
  END AS segment,
  COUNT(*) AS user_count,
  AVG(p."totalSpent") AS avg_spent,
  MAX(p."totalSpent") AS max_spent
FROM profiles p
GROUP BY segment
ORDER BY avg_spent DESC;

-- ■ ۹. آمار گردونه شانس ────────────────────────────────────────

SELECT
  wp.name AS prize_name,
  wp.type AS prize_type,
  wp.value,
  COUNT(ws.id) AS spin_count,
  ROUND(COUNT(ws.id) * 100.0 / SUM(COUNT(ws.id)) OVER (), 2) AS actual_percent
FROM wheel_prizes wp
LEFT JOIN wheel_spins ws ON ws."prizeId" = wp.id
GROUP BY wp.id, wp.name, wp.type, wp.value
ORDER BY spin_count DESC;

-- ■ ۱۰. کمپین‌ها با نرخ تبدیل ────────────────────────────────

SELECT
  c.name,
  c.type,
  c.status,
  c."sentCount",
  c."openedCount",
  c."convertedCount",
  CASE
    WHEN c."sentCount" > 0
    THEN ROUND(c."openedCount" * 100.0 / c."sentCount", 2)
    ELSE 0
  END AS open_rate,
  CASE
    WHEN c."openedCount" > 0
    THEN ROUND(c."convertedCount" * 100.0 / c."openedCount", 2)
    ELSE 0
  END AS conversion_rate,
  c.budget,
  c.revenue
FROM campaigns c
ORDER BY conversion_rate DESC;

-- ■ ۱۱. کاربران غیرفعال (خطر ریزش) ────────────────────────────

SELECT
  u.id,
  u."fullName",
  u.mobile,
  p."totalBookings",
  p."successfulBookings",
  MAX(b."createdAt") AS last_booking_date,
  NOW() - MAX(b."createdAt") AS days_since_last_booking
FROM users u
JOIN profiles p ON p."userId" = u.id
LEFT JOIN bookings b ON b."userId" = u.id
WHERE
  u."isActive" = true
  AND u."isBanned" = false
  AND p."totalBookings" > 0
GROUP BY u.id, u."fullName", u.mobile, p."totalBookings", p."successfulBookings"
HAVING MAX(b."createdAt") < NOW() - INTERVAL '60 days'
ORDER BY days_since_last_booking DESC
LIMIT 20;

-- ■ ۱۲. پایپ‌لاین فروش CRM ─────────────────────────────────────

SELECT
  stage,
  COUNT(*) AS deal_count,
  SUM(value) AS total_value,
  AVG(value) AS avg_value
FROM pipeline_deals
GROUP BY stage
ORDER BY
  CASE stage
    WHEN 'LEADS'       THEN 1
    WHEN 'CONTACTED'   THEN 2
    WHEN 'PROPOSED'    THEN 3
    WHEN 'NEGOTIATING' THEN 4
    WHEN 'CLOSED_WON'  THEN 5
    WHEN 'CLOSED_LOST' THEN 6
  END;

-- ■ ۱۳. آمار کدهای تخفیف ─────────────────────────────────────

SELECT
  dc.code,
  dc.name,
  dc.type,
  dc.value,
  dc."usedCount",
  dc."maxUses",
  dc."validUntil",
  dc."isActive",
  COALESCE(SUM(du."savedAmount"), 0) AS total_saved
FROM discount_codes dc
LEFT JOIN discount_usages du ON du."codeId" = dc.id
GROUP BY dc.id, dc.code, dc.name, dc.type, dc.value, dc."usedCount", dc."maxUses", dc."validUntil", dc."isActive"
ORDER BY dc."usedCount" DESC;

-- ■ ۱۴. شهرها با بیشترین رزرو ─────────────────────────────────

SELECT
  ci.name AS city_name,
  COUNT(b.id) AS booking_count,
  SUM(b."totalAmount") AS city_revenue
FROM cities ci
JOIN branches br ON br."cityId" = ci.id
JOIN bookings b ON b."branchId" = br.id
WHERE b.status = 'COMPLETED'
GROUP BY ci.id, ci.name
ORDER BY booking_count DESC;

-- ■ ۱۵. بررسی سلامت دیتابیس (تعداد رکوردهای هر جدول) ──────────

SELECT
  schemaname,
  tablename,
  n_live_tup AS live_rows,
  n_dead_tup AS dead_rows,
  last_vacuum,
  last_analyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY live_rows DESC;

-- ■ ۱۶. آمار PlayerRating — امتیازات بازیکنان ────────────────────
-- بررسی XP دریافتی و اعطایی هر کاربر

SELECT
  u.id,
  u."fullName",
  u.nickname,
  COUNT(pr_received.id)           AS ratings_received,
  COALESCE(SUM(pr_received."xpChange"), 0) AS total_xp_received,
  COALESCE(AVG(pr_received."xpChange"), 0) AS avg_xp_per_rating,
  COUNT(pr_given.id)              AS ratings_given
FROM users u
LEFT JOIN player_ratings pr_received ON pr_received."toUserId" = u.id
LEFT JOIN player_ratings pr_given    ON pr_given."fromUserId" = u.id
GROUP BY u.id, u."fullName", u.nickname
ORDER BY total_xp_received DESC
LIMIT 20;

-- ■ ۱۷. PlayerRating — جزئیات امتیاز با رزرو مرتبط ────────────────

SELECT
  pr.id,
  giver.id          AS giver_id,
  giver."fullName"  AS giver_name,
  receiver.id       AS receiver_id,
  receiver."fullName" AS receiver_name,
  pr."xpChange",
  pr.reason,
  b.code            AS booking_code,
  b."slotDateTime"  AS session_time,
  g.title           AS game_title,
  pr."createdAt"
FROM player_ratings pr
JOIN users giver    ON giver.id    = pr."fromUserId"
JOIN users receiver ON receiver.id = pr."toUserId"
LEFT JOIN bookings b ON b.id = pr."bookingId"
LEFT JOIN games g    ON g.id = b."gameId"
ORDER BY pr."createdAt" DESC
LIMIT 50;

-- ■ ۱۸. PlayerRating — توزیع XP بر اساس دلیل ──────────────────────

SELECT
  COALESCE(reason, 'نامشخص') AS reason,
  COUNT(*)                    AS count,
  AVG("xpChange")             AS avg_xp,
  SUM("xpChange")             AS total_xp
FROM player_ratings
GROUP BY reason
ORDER BY count DESC;

-- ■ ۱۹. InviteUsage — آمار کدهای دعوت ────────────────────────────

SELECT
  ic.code,
  owner.id            AS owner_id,
  owner."fullName"    AS owner_name,
  ic."totalUses",
  ic."totalRewardXp",
  COUNT(iu.id)        AS confirmed_usages,
  SUM(iu."rewardXpGiven") AS total_xp_rewarded
FROM invite_codes ic
JOIN users owner ON owner.id = ic."userId"
LEFT JOIN invite_usages iu ON iu."codeId" = ic.id
GROUP BY ic.id, ic.code, owner.id, owner."fullName", ic."totalUses", ic."totalRewardXp"
ORDER BY ic."totalUses" DESC
LIMIT 20;

-- ■ ۲۰. InviteUsage — جزئیات هر دعوت ────────────────────────────

SELECT
  ic.code,
  owner."fullName"    AS inviter_name,
  invited."fullName"  AS invited_name,
  invited.mobile,
  iu."rewardXpGiven",
  iu."createdAt"
FROM invite_usages iu
JOIN invite_codes ic    ON ic.id  = iu."codeId"
JOIN users owner        ON owner.id = ic."userId"
JOIN users invited      ON invited.id = iu."invitedUserId"
ORDER BY iu."createdAt" DESC
LIMIT 50;

-- ■ ۲۱. InviteUsage — بهترین دعوت‌کنندگان (ویروسی‌ترین کاربران) ──

SELECT
  u.id,
  u."fullName",
  u.nickname,
  ic.code,
  ic."totalUses"      AS invite_count,
  ic."totalRewardXp"  AS total_xp_earned
FROM invite_codes ic
JOIN users u ON u.id = ic."userId"
WHERE ic."totalUses" > 0
ORDER BY ic."totalUses" DESC
LIMIT 10;

-- ■ ۲۲. MonthlyWinner — برندگان ماهانه (Polymorphic) ────────────────

SELECT
  mw.id,
  mw.year,
  mw.month,
  mw.type,
  -- بر اساس نوع، اطلاعات برنده را نمایش می‌دهیم
  CASE mw.type
    WHEN 'TOP_PLAYER' THEN u."fullName"
    WHEN 'TOP_TEAM'   THEN t.name
    WHEN 'TOP_GAME'   THEN g.title
  END AS winner_name,
  mw."winnerUserId",
  mw."winnerTeamId",
  mw."winnerGameId",
  mw."prizeJson",
  mw."distributedAt",
  dist."fullName" AS distributed_by_name
FROM monthly_winners mw
LEFT JOIN users u ON u.id = mw."winnerUserId"
LEFT JOIN teams t ON t.id = mw."winnerTeamId"
LEFT JOIN games g ON g.id = mw."winnerGameId"
LEFT JOIN users dist ON dist.id = mw."distributedBy"
ORDER BY mw.year DESC, mw.month DESC, mw.type;

-- ■ ۲۳. MonthlyWinner — تاریخچه برندگان به تفکیک نوع ─────────────

-- برندگان TOP_PLAYER
SELECT
  mw.year,
  mw.month,
  u.id          AS user_id,
  u."fullName"  AS winner,
  u.nickname,
  mw."prizeJson"->'toman'   AS prize_toman,
  mw."prizeJson"->'badge'   AS prize_badge,
  mw."distributedAt"
FROM monthly_winners mw
JOIN users u ON u.id = mw."winnerUserId"
WHERE mw.type = 'TOP_PLAYER'
ORDER BY mw.year DESC, mw.month DESC;

-- برندگان TOP_GAME
SELECT
  mw.year,
  mw.month,
  g.id         AS game_id,
  g.title      AS winner_game,
  g.slug,
  mw."prizeJson",
  mw."distributedAt"
FROM monthly_winners mw
JOIN games g ON g.id = mw."winnerGameId"
WHERE mw.type = 'TOP_GAME'
ORDER BY mw.year DESC, mw.month DESC;

-- ■ ۲۴. MonthlyWinner — بررسی یکپارچگی CHECK CONSTRAINT ──────────
-- این query باید هیچ رکوردی برنگرداند (نشانه سلامت داده)

SELECT id, type, "winnerUserId", "winnerTeamId", "winnerGameId"
FROM monthly_winners
WHERE
  (type = 'TOP_PLAYER' AND "winnerUserId" IS NULL)
  OR (type = 'TOP_TEAM'   AND "winnerTeamId" IS NULL)
  OR (type = 'TOP_GAME'   AND "winnerGameId" IS NULL);

-- ■ ۲۵. گزارش جامع سلامت گیمیفیکیشن ─────────────────────────────

SELECT
  'Levels'          AS entity, COUNT(*) AS count FROM levels
UNION ALL
SELECT 'Badges',       COUNT(*) FROM badges
UNION ALL
SELECT 'UserBadges',   COUNT(*) FROM user_badges
UNION ALL
SELECT 'AvatarItems',  COUNT(*) FROM avatar_items
UNION ALL
SELECT 'WheelPrizes',  COUNT(*) FROM wheel_prizes
UNION ALL
SELECT 'WheelSpins',   COUNT(*) FROM wheel_spins
UNION ALL
SELECT 'InviteCodes',  COUNT(*) FROM invite_codes
UNION ALL
SELECT 'InviteUsages', COUNT(*) FROM invite_usages
UNION ALL
SELECT 'PlayerRatings',COUNT(*) FROM player_ratings
UNION ALL
SELECT 'MonthlyWins',  COUNT(*) FROM monthly_winners;
