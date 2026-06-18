-- ============================================================
-- TIK TAK RUN — Initial Migration
-- Generated: 2026-01-01
-- ============================================================

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'SUPPORT', 'MARKETING', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUND');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('WALLET', 'ZARINPAL', 'IDPAY', 'BANK_TRANSFER', 'CASH');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('DEPOSIT', 'WITHDRAW', 'BOOKING_PAYMENT', 'REFUND', 'WHEEL_SPEND', 'WHEEL_WIN', 'DIAMOND_PURCHASE', 'COIN_PURCHASE', 'INVITE_REWARD', 'MONTHLY_REWARD', 'MANUAL_ADJUST', 'RATING_REWARD');

-- CreateEnum
CREATE TYPE "CurrencyType" AS ENUM ('TOMAN', 'COINS', 'DIAMONDS', 'XP');

-- CreateEnum
CREATE TYPE "ChatRoomType" AS ENUM ('GLOBAL', 'TEAM', 'PRIVATE');

-- CreateEnum
CREATE TYPE "ChatMessageStatus" AS ENUM ('NORMAL', 'REPORTED', 'HIDDEN', 'DELETED');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_USER', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "CampaignType" AS ENUM ('SMS', 'EMAIL', 'INAPP', 'PUSH');

-- CreateEnum
CREATE TYPE "PipelineStage" AS ENUM ('LEADS', 'CONTACTED', 'PROPOSED', 'NEGOTIATING', 'CLOSED_WON', 'CLOSED_LOST');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENT', 'FIXED');

-- CreateEnum
CREATE TYPE "AvatarItemType" AS ENUM ('HAT', 'GLASSES', 'SKIN', 'EFFECT', 'BACKGROUND', 'ACCESSORY');

-- CreateEnum
CREATE TYPE "WheelPrizeType" AS ENUM ('COINS', 'DIAMONDS', 'XP', 'DISCOUNT_CODE', 'FREE_TICKET', 'TOMAN');

-- CreateEnum
CREATE TYPE "LevelTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'LEGEND');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('BOOKING', 'PAYMENT', 'LEVEL', 'BADGE', 'WHEEL', 'TEAM', 'CHAT', 'SYSTEM', 'PROMOTION');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('INAPP', 'SMS', 'EMAIL');

-- CreateEnum
CREATE TYPE "GameDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD', 'VERY_HARD', 'LEGENDARY');

-- CreateEnum
CREATE TYPE "GenreFilter" AS ENUM ('HORROR', 'NON_HORROR');

-- CreateEnum
CREATE TYPE "ModerationActionType" AS ENUM ('WARN', 'MUTE_24H', 'BAN', 'DELETE_MSG');

-- CreateEnum
CREATE TYPE "TeamStatus" AS ENUM ('FORMING', 'FULL', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TeamMemberRole" AS ENUM ('CAPTAIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "MonthlyWinnerType" AS ENUM ('TOP_PLAYER', 'TOP_TEAM', 'TOP_GAME');

-- CreateEnum
CREATE TYPE "AutoDiscountRule" AS ENUM ('VIP', 'WEEKLY', 'FIRST_BOOKING', 'BIRTHDAY', 'INVITE');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- ============================================================
-- CreateTable: cities
-- ============================================================
CREATE TABLE "cities" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "cities_slug_key" ON "cities"("slug");
CREATE INDEX "cities_slug_idx" ON "cities"("slug");

-- ============================================================
-- CreateTable: branches
-- ============================================================
CREATE TABLE "branches" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "cityId" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT,
    "lat" DECIMAL(10,8),
    "lng" DECIMAL(11,8),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "managerId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "branches_cityId_idx" ON "branches"("cityId");
CREATE INDEX "branches_isActive_idx" ON "branches"("isActive");

-- ============================================================
-- CreateTable: categories
-- ============================================================
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "genre" "GenreFilter" NOT NULL DEFAULT 'HORROR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");
CREATE INDEX "categories_slug_idx" ON "categories"("slug");

-- ============================================================
-- CreateTable: games
-- ============================================================
CREATE TABLE "games" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "categoryId" INTEGER NOT NULL,
    "branchId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "scenario" TEXT,
    "fearLevel" INTEGER NOT NULL DEFAULT 3,
    "difficulty" "GameDifficulty" NOT NULL DEFAULT 'MEDIUM',
    "minPlayers" INTEGER NOT NULL DEFAULT 2,
    "maxPlayers" INTEGER NOT NULL DEFAULT 6,
    "durationMinutes" INTEGER NOT NULL DEFAULT 60,
    "pricePerPerson" BIGINT NOT NULL,
    "siteRank" DECIMAL(3,2) NOT NULL DEFAULT 4.0,
    "userRankCached" DECIMAL(3,2),
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "teaserUrl" TEXT,
    "coverImage" TEXT,
    "tags" TEXT[],
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "weeklyDiscountPercent" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "games_slug_key" ON "games"("slug");
CREATE INDEX "games_slug_idx" ON "games"("slug");
CREATE INDEX "games_categoryId_idx" ON "games"("categoryId");
CREATE INDEX "games_branchId_idx" ON "games"("branchId");
CREATE INDEX "games_isActive_isFeatured_idx" ON "games"("isActive", "isFeatured");
CREATE INDEX "games_siteRank_idx" ON "games"("siteRank");

-- ============================================================
-- CreateTable: game_images
-- ============================================================
CREATE TABLE "game_images" (
    "id" SERIAL NOT NULL,
    "gameId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_images_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "game_images_gameId_idx" ON "game_images"("gameId");

-- ============================================================
-- CreateTable: users
-- ============================================================
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "mobile" CITEXT NOT NULL,
    "email" CITEXT,
    "fullName" TEXT,
    "nickname" TEXT,
    "avatarUrl" TEXT,
    "avatarConfig" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "isMuted" BOOLEAN NOT NULL DEFAULT false,
    "mutedUntil" TIMESTAMP(3),
    "inviteCode" TEXT NOT NULL,
    "invitedById" INTEGER,
    "lastLoginAt" TIMESTAMP(3),
    "lastIp" TEXT,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_mobile_key" ON "users"("mobile");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_nickname_key" ON "users"("nickname");
CREATE UNIQUE INDEX "users_inviteCode_key" ON "users"("inviteCode");
CREATE INDEX "users_mobile_idx" ON "users"("mobile");
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "users_inviteCode_idx" ON "users"("inviteCode");
CREATE INDEX "users_isActive_isBanned_idx" ON "users"("isActive", "isBanned");

-- ============================================================
-- CreateTable: user_role_assignments
-- ============================================================
CREATE TABLE "user_role_assignments" (
    "userId" INTEGER NOT NULL,
    "role" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantedBy" INTEGER,

    CONSTRAINT "user_role_assignments_pkey" PRIMARY KEY ("userId", "role")
);

-- ============================================================
-- CreateTable: levels
-- ============================================================
CREATE TABLE "levels" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "tier" "LevelTier" NOT NULL,
    "requiredXp" INTEGER NOT NULL,
    "perks" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "levels_pkey" PRIMARY KEY ("id")
);

-- ============================================================
-- CreateTable: profiles
-- ============================================================
CREATE TABLE "profiles" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "levelId" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "totalBookings" INTEGER NOT NULL DEFAULT 0,
    "successfulBookings" INTEGER NOT NULL DEFAULT 0,
    "totalSpent" BIGINT NOT NULL DEFAULT 0,
    "averageRating" DECIMAL(3,2),
    "fearLevel" DECIMAL(3,1) NOT NULL DEFAULT 0,
    "bio" TEXT,
    "instagramHandle" TEXT,
    "telegramHandle" TEXT,
    "birthDate" TIMESTAMP(3),
    "gender" "Gender",
    "address" TEXT,
    "cityId" INTEGER,
    "statsCache" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "profiles_userId_key" ON "profiles"("userId");
CREATE INDEX "profiles_userId_idx" ON "profiles"("userId");
CREATE INDEX "profiles_levelId_idx" ON "profiles"("levelId");
CREATE INDEX "profiles_xp_idx" ON "profiles"("xp");

-- ============================================================
-- CreateTable: wallets
-- ============================================================
CREATE TABLE "wallets" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "tomanBalance" BIGINT NOT NULL DEFAULT 0,
    "coinsBalance" INTEGER NOT NULL DEFAULT 0,
    "diamondsBalance" INTEGER NOT NULL DEFAULT 0,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "wallets_userId_key" ON "wallets"("userId");
CREATE INDEX "wallets_userId_idx" ON "wallets"("userId");

-- ============================================================
-- CreateTable: transactions
-- ============================================================
CREATE TABLE "transactions" (
    "id" SERIAL NOT NULL,
    "walletId" INTEGER NOT NULL,
    "type" "TransactionType" NOT NULL,
    "currency" "CurrencyType" NOT NULL,
    "amount" BIGINT NOT NULL,
    "balanceAfter" BIGINT NOT NULL,
    "description" TEXT,
    "refType" TEXT,
    "refId" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "transactions_walletId_idx" ON "transactions"("walletId");
CREATE INDEX "transactions_type_idx" ON "transactions"("type");
CREATE INDEX "transactions_createdAt_idx" ON "transactions"("createdAt");

-- ============================================================
-- CreateTable: payments
-- ============================================================
CREATE TABLE "payments" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "bookingId" INTEGER,
    "walletId" INTEGER,
    "amount" BIGINT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "gateway" TEXT,
    "gatewayAuthority" TEXT,
    "gatewayRefId" TEXT,
    "gatewayResponse" JSONB,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payments_bookingId_key" ON "payments"("bookingId");
CREATE INDEX "payments_userId_idx" ON "payments"("userId");
CREATE INDEX "payments_status_idx" ON "payments"("status");
CREATE INDEX "payments_gatewayAuthority_idx" ON "payments"("gatewayAuthority");
CREATE INDEX "payments_createdAt_idx" ON "payments"("createdAt");

-- ============================================================
-- CreateTable: bookings
-- ============================================================
CREATE TABLE "bookings" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "gameId" INTEGER NOT NULL,
    "branchId" INTEGER NOT NULL,
    "slotDateTime" TIMESTAMP(3) NOT NULL,
    "playersCount" INTEGER NOT NULL,
    "basePrice" BIGINT NOT NULL,
    "discountApplied" BIGINT NOT NULL DEFAULT 0,
    "totalAmount" BIGINT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'WALLET',
    "discountCodeId" INTEGER,
    "note" TEXT,
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "rewardsEarnedXp" INTEGER NOT NULL DEFAULT 0,
    "rewardsEarnedCoins" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "bookings_code_key" ON "bookings"("code");
CREATE INDEX "bookings_userId_idx" ON "bookings"("userId");
CREATE INDEX "bookings_gameId_idx" ON "bookings"("gameId");
CREATE INDEX "bookings_branchId_idx" ON "bookings"("branchId");
CREATE INDEX "bookings_status_idx" ON "bookings"("status");
CREATE INDEX "bookings_slotDateTime_idx" ON "bookings"("slotDateTime");
CREATE INDEX "bookings_code_idx" ON "bookings"("code");
CREATE INDEX "bookings_createdAt_idx" ON "bookings"("createdAt");

-- ============================================================
-- CreateTable: game_reviews
-- ============================================================
CREATE TABLE "game_reviews" (
    "id" SERIAL NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "gameId" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "text" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_reviews_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "game_reviews_bookingId_key" ON "game_reviews"("bookingId");
CREATE INDEX "game_reviews_gameId_idx" ON "game_reviews"("gameId");
CREATE INDEX "game_reviews_userId_idx" ON "game_reviews"("userId");
CREATE INDEX "game_reviews_isApproved_idx" ON "game_reviews"("isApproved");
CREATE INDEX "game_reviews_rating_idx" ON "game_reviews"("rating");

-- ============================================================
-- CreateTable: player_ratings
-- ============================================================
CREATE TABLE "player_ratings" (
    "id" SERIAL NOT NULL,
    "fromUserId" INTEGER NOT NULL,
    "toUserId" INTEGER NOT NULL,
    "bookingId" INTEGER,
    "xpChange" INTEGER NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "player_ratings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "player_ratings_toUserId_idx" ON "player_ratings"("toUserId");
CREATE INDEX "player_ratings_fromUserId_idx" ON "player_ratings"("fromUserId");

-- ============================================================
-- CreateTable: badges
-- ============================================================
CREATE TABLE "badges" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "criteria" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "badges_code_key" ON "badges"("code");
CREATE INDEX "badges_code_idx" ON "badges"("code");

-- ============================================================
-- CreateTable: user_badges
-- ============================================================
CREATE TABLE "user_badges" (
    "userId" INTEGER NOT NULL,
    "badgeId" INTEGER NOT NULL,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "awardedBy" INTEGER,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("userId", "badgeId")
);

-- ============================================================
-- CreateTable: avatar_items
-- ============================================================
CREATE TABLE "avatar_items" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AvatarItemType" NOT NULL,
    "icon" TEXT NOT NULL,
    "imageUrl" TEXT,
    "requiredLevel" INTEGER NOT NULL DEFAULT 1,
    "priceDiamonds" INTEGER,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avatar_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "avatar_items_code_key" ON "avatar_items"("code");
CREATE INDEX "avatar_items_type_idx" ON "avatar_items"("type");

-- ============================================================
-- CreateTable: user_avatar_items
-- ============================================================
CREATE TABLE "user_avatar_items" (
    "userId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_avatar_items_pkey" PRIMARY KEY ("userId", "itemId")
);

-- ============================================================
-- CreateTable: wheel_prizes
-- ============================================================
CREATE TABLE "wheel_prizes" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "WheelPrizeType" NOT NULL,
    "value" INTEGER NOT NULL,
    "probabilityWeight" INTEGER NOT NULL,
    "color" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wheel_prizes_pkey" PRIMARY KEY ("id")
);

-- ============================================================
-- CreateTable: wheel_spins
-- ============================================================
CREATE TABLE "wheel_spins" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "paidWith" "CurrencyType" NOT NULL,
    "costPaid" INTEGER NOT NULL,
    "prizeId" INTEGER NOT NULL,
    "prizeSnapshot" JSONB NOT NULL,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wheel_spins_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "wheel_spins_userId_idx" ON "wheel_spins"("userId");
CREATE INDEX "wheel_spins_awardedAt_idx" ON "wheel_spins"("awardedAt");

-- ============================================================
-- CreateTable: invite_codes
-- ============================================================
CREATE TABLE "invite_codes" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "totalUses" INTEGER NOT NULL DEFAULT 0,
    "totalRewardXp" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invite_codes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "invite_codes_userId_key" ON "invite_codes"("userId");
CREATE UNIQUE INDEX "invite_codes_code_key" ON "invite_codes"("code");
CREATE INDEX "invite_codes_code_idx" ON "invite_codes"("code");

-- ============================================================
-- CreateTable: invite_usages
-- ============================================================
CREATE TABLE "invite_usages" (
    "id" SERIAL NOT NULL,
    "codeId" INTEGER NOT NULL,
    "invitedUserId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rewardXpGiven" INTEGER NOT NULL DEFAULT 5,

    CONSTRAINT "invite_usages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "invite_usages_invitedUserId_key" ON "invite_usages"("invitedUserId");
CREATE INDEX "invite_usages_codeId_idx" ON "invite_usages"("codeId");

-- ============================================================
-- CreateTable: chat_rooms
-- ============================================================
CREATE TABLE "chat_rooms" (
    "id" SERIAL NOT NULL,
    "type" "ChatRoomType" NOT NULL,
    "name" TEXT,
    "teamId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_rooms_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "chat_rooms_teamId_key" ON "chat_rooms"("teamId");

-- ============================================================
-- CreateTable: chat_messages
-- ============================================================
CREATE TABLE "chat_messages" (
    "id" SERIAL NOT NULL,
    "roomId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "status" "ChatMessageStatus" NOT NULL DEFAULT 'NORMAL',
    "reportsCount" INTEGER NOT NULL DEFAULT 0,
    "parentMessageId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "chat_messages_roomId_idx" ON "chat_messages"("roomId");
CREATE INDEX "chat_messages_userId_idx" ON "chat_messages"("userId");
CREATE INDEX "chat_messages_createdAt_idx" ON "chat_messages"("createdAt");

-- ============================================================
-- CreateTable: chat_moderation_actions
-- ============================================================
CREATE TABLE "chat_moderation_actions" (
    "id" SERIAL NOT NULL,
    "messageId" INTEGER,
    "userId" INTEGER NOT NULL,
    "moderatorId" INTEGER NOT NULL,
    "action" "ModerationActionType" NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_moderation_actions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "chat_moderation_actions_userId_idx" ON "chat_moderation_actions"("userId");

-- ============================================================
-- CreateTable: teams
-- ============================================================
CREATE TABLE "teams" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "gameId" INTEGER NOT NULL,
    "branchId" INTEGER,
    "captainId" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL,
    "slotDateTime" TIMESTAMP(3),
    "status" "TeamStatus" NOT NULL DEFAULT 'FORMING',
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "teams_gameId_idx" ON "teams"("gameId");
CREATE INDEX "teams_status_idx" ON "teams"("status");

-- ============================================================
-- CreateTable: team_members
-- ============================================================
CREATE TABLE "team_members" (
    "teamId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" "TeamMemberRole" NOT NULL DEFAULT 'MEMBER',

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("teamId", "userId")
);

-- ============================================================
-- CreateTable: notifications
-- ============================================================
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" "NotificationType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'INAPP',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");
CREATE INDEX "notifications_isRead_idx" ON "notifications"("isRead");
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- ============================================================
-- CreateTable: sms_logs
-- ============================================================
CREATE TABLE "sms_logs" (
    "id" SERIAL NOT NULL,
    "mobile" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "vars" JSONB,
    "status" TEXT NOT NULL,
    "providerRef" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "error" TEXT,
    "userId" INTEGER,

    CONSTRAINT "sms_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "sms_logs_mobile_idx" ON "sms_logs"("mobile");
CREATE INDEX "sms_logs_sentAt_idx" ON "sms_logs"("sentAt");

-- ============================================================
-- CreateTable: tickets
-- ============================================================
CREATE TABLE "tickets" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "assigneeId" INTEGER,
    "branchId" INTEGER,
    "lastReplyAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tickets_code_key" ON "tickets"("code");
CREATE INDEX "tickets_userId_idx" ON "tickets"("userId");
CREATE INDEX "tickets_status_idx" ON "tickets"("status");
CREATE INDEX "tickets_priority_idx" ON "tickets"("priority");

-- ============================================================
-- CreateTable: ticket_messages
-- ============================================================
CREATE TABLE "ticket_messages" (
    "id" SERIAL NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "senderId" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "isStaffReply" BOOLEAN NOT NULL DEFAULT false,
    "attachments" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ticket_messages_ticketId_idx" ON "ticket_messages"("ticketId");

-- ============================================================
-- CreateTable: customer_segments
-- ============================================================
CREATE TABLE "customer_segments" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "color" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "cachedCount" INTEGER NOT NULL DEFAULT 0,
    "lastComputedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_segments_pkey" PRIMARY KEY ("id")
);

-- ============================================================
-- CreateTable: campaigns
-- ============================================================
CREATE TABLE "campaigns" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CampaignType" NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "segmentId" INTEGER,
    "content" JSONB NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "budget" BIGINT NOT NULL DEFAULT 0,
    "revenue" BIGINT NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "openedCount" INTEGER NOT NULL DEFAULT 0,
    "clickedCount" INTEGER NOT NULL DEFAULT 0,
    "convertedCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "campaigns_status_idx" ON "campaigns"("status");
CREATE INDEX "campaigns_type_idx" ON "campaigns"("type");

-- ============================================================
-- CreateTable: pipeline_deals
-- ============================================================
CREATE TABLE "pipeline_deals" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "customerId" INTEGER,
    "value" BIGINT NOT NULL,
    "stage" "PipelineStage" NOT NULL DEFAULT 'LEADS',
    "position" INTEGER NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "tag" TEXT,
    "expectedCloseDate" TIMESTAMP(3),
    "notes" TEXT,
    "lostReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pipeline_deals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "pipeline_deals_stage_idx" ON "pipeline_deals"("stage");
CREATE INDEX "pipeline_deals_ownerId_idx" ON "pipeline_deals"("ownerId");

-- ============================================================
-- CreateTable: discount_codes
-- ============================================================
CREATE TABLE "discount_codes" (
    "id" SERIAL NOT NULL,
    "code" CITEXT NOT NULL,
    "name" TEXT,
    "type" "DiscountType" NOT NULL,
    "value" INTEGER NOT NULL,
    "minPurchase" BIGINT NOT NULL DEFAULT 0,
    "maxDiscount" BIGINT,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "targetSegmentId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discount_codes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "discount_codes_code_key" ON "discount_codes"("code");
CREATE INDEX "discount_codes_code_idx" ON "discount_codes"("code");
CREATE INDEX "discount_codes_isActive_idx" ON "discount_codes"("isActive");

-- ============================================================
-- CreateTable: game_discount_codes (junction)
-- ============================================================
CREATE TABLE "_GameDiscounts" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

CREATE UNIQUE INDEX "_GameDiscounts_AB_unique" ON "_GameDiscounts"("A", "B");
CREATE INDEX "_GameDiscounts_B_index" ON "_GameDiscounts"("B");

-- ============================================================
-- CreateTable: discount_usages
-- ============================================================
CREATE TABLE "discount_usages" (
    "id" SERIAL NOT NULL,
    "codeId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "savedAmount" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discount_usages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "discount_usages_bookingId_key" ON "discount_usages"("bookingId");
CREATE INDEX "discount_usages_codeId_idx" ON "discount_usages"("codeId");
CREATE INDEX "discount_usages_userId_idx" ON "discount_usages"("userId");

-- ============================================================
-- CreateTable: auto_discounts
-- ============================================================
CREATE TABLE "auto_discounts" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "DiscountType" NOT NULL,
    "value" INTEGER NOT NULL,
    "ruleType" "AutoDiscountRule" NOT NULL,
    "conditions" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auto_discounts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "auto_discounts_ruleType_idx" ON "auto_discounts"("ruleType");

-- ============================================================
-- CreateTable: settings
-- ============================================================
CREATE TABLE "settings" (
    "key" CITEXT NOT NULL,
    "value" JSONB NOT NULL,
    "group" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" INTEGER,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "settings_group_idx" ON "settings"("group");

-- ============================================================
-- CreateTable: monthly_winners
-- طراحی polymorphic: هر نوع برنده FK جداگانه دارد
-- TOP_PLAYER: winnerUserId دارد
-- TOP_TEAM:   winnerTeamId دارد
-- TOP_GAME:   winnerGameId دارد
-- ============================================================
CREATE TABLE "monthly_winners" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "type" "MonthlyWinnerType" NOT NULL,
    -- FK جداگانه برای هر نوع برنده (polymorphic nullable)
    "winnerUserId"  INTEGER,
    "winnerTeamId"  INTEGER,
    "winnerGameId"  INTEGER,
    "prizeJson" JSONB NOT NULL,
    "distributedAt" TIMESTAMP(3),
    "distributedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monthly_winners_pkey" PRIMARY KEY ("id"),
    -- هر ماه فقط یک برنده برای هر نوع
    CONSTRAINT "monthly_winners_check_type"
      CHECK (
        (type = 'TOP_PLAYER' AND "winnerUserId" IS NOT NULL AND "winnerTeamId" IS NULL AND "winnerGameId" IS NULL) OR
        (type = 'TOP_TEAM'   AND "winnerTeamId" IS NOT NULL AND "winnerUserId" IS NULL AND "winnerGameId" IS NULL) OR
        (type = 'TOP_GAME'   AND "winnerGameId" IS NOT NULL AND "winnerUserId" IS NULL AND "winnerTeamId" IS NULL)
      )
);

CREATE UNIQUE INDEX "monthly_winners_year_month_type_key" ON "monthly_winners"("year", "month", "type");
CREATE INDEX "monthly_winners_year_month_idx" ON "monthly_winners"("year", "month");

-- ============================================================
-- CreateTable: audit_logs
-- ============================================================
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "actorId" INTEGER,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "beforeJson" JSONB,
    "afterJson" JSONB,
    "ip" TEXT,
    "ua" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");
CREATE INDEX "audit_logs_entity_entityId_idx" ON "audit_logs"("entity", "entityId");
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- ============================================================
-- CreateTable: sessions
-- ============================================================
CREATE TABLE "sessions" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "refreshTokenHash" TEXT NOT NULL,
    "ip" TEXT,
    "ua" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");

-- ============================================================
-- CreateTable: otp_requests
-- ============================================================
CREATE TABLE "otp_requests" (
    "id" SERIAL NOT NULL,
    "mobile" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "ip" TEXT,
    "userId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "otp_requests_mobile_idx" ON "otp_requests"("mobile");
CREATE INDEX "otp_requests_expiresAt_idx" ON "otp_requests"("expiresAt");

-- ============================================================
-- AddForeignKey constraints
-- ============================================================

ALTER TABLE "branches" ADD CONSTRAINT "branches_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "branches" ADD CONSTRAINT "branches_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "games" ADD CONSTRAINT "games_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "games" ADD CONSTRAINT "games_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "game_images" ADD CONSTRAINT "game_images_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "users" ADD CONSTRAINT "users_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_discountCodeId_fkey" FOREIGN KEY ("discountCodeId") REFERENCES "discount_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "game_reviews" ADD CONSTRAINT "game_reviews_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "game_reviews" ADD CONSTRAINT "game_reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "game_reviews" ADD CONSTRAINT "game_reviews_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "player_ratings" ADD CONSTRAINT "player_ratings_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "player_ratings" ADD CONSTRAINT "player_ratings_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "player_ratings" ADD CONSTRAINT "player_ratings_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "badges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_avatar_items" ADD CONSTRAINT "user_avatar_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_avatar_items" ADD CONSTRAINT "user_avatar_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "avatar_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "wheel_spins" ADD CONSTRAINT "wheel_spins_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "wheel_spins" ADD CONSTRAINT "wheel_spins_prizeId_fkey" FOREIGN KEY ("prizeId") REFERENCES "wheel_prizes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "invite_codes" ADD CONSTRAINT "invite_codes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "invite_usages" ADD CONSTRAINT "invite_usages_codeId_fkey" FOREIGN KEY ("codeId") REFERENCES "invite_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "invite_usages" ADD CONSTRAINT "invite_usages_invitedUserId_fkey" FOREIGN KEY ("invitedUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_rooms" ADD CONSTRAINT "chat_rooms_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "chat_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_parentMessageId_fkey" FOREIGN KEY ("parentMessageId") REFERENCES "chat_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "chat_moderation_actions" ADD CONSTRAINT "chat_moderation_actions_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "chat_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "chat_moderation_actions" ADD CONSTRAINT "chat_moderation_actions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_moderation_actions" ADD CONSTRAINT "chat_moderation_actions_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "teams" ADD CONSTRAINT "teams_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "teams" ADD CONSTRAINT "teams_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "teams" ADD CONSTRAINT "teams_captainId_fkey" FOREIGN KEY ("captainId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sms_logs" ADD CONSTRAINT "sms_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "customer_segments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pipeline_deals" ADD CONSTRAINT "pipeline_deals_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pipeline_deals" ADD CONSTRAINT "pipeline_deals_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "discount_codes" ADD CONSTRAINT "discount_codes_targetSegmentId_fkey" FOREIGN KEY ("targetSegmentId") REFERENCES "customer_segments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "discount_usages" ADD CONSTRAINT "discount_usages_codeId_fkey" FOREIGN KEY ("codeId") REFERENCES "discount_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "discount_usages" ADD CONSTRAINT "discount_usages_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- monthly_winners — FK های polymorphic (هر سه nullable + SET NULL)
ALTER TABLE "monthly_winners" ADD CONSTRAINT "monthly_winners_winnerUserId_fkey" FOREIGN KEY ("winnerUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "monthly_winners" ADD CONSTRAINT "monthly_winners_winnerTeamId_fkey" FOREIGN KEY ("winnerTeamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "monthly_winners" ADD CONSTRAINT "monthly_winners_winnerGameId_fkey" FOREIGN KEY ("winnerGameId") REFERENCES "games"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "otp_requests" ADD CONSTRAINT "otp_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "_GameDiscounts" ADD CONSTRAINT "_GameDiscounts_A_fkey" FOREIGN KEY ("A") REFERENCES "discount_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_GameDiscounts" ADD CONSTRAINT "_GameDiscounts_B_fkey" FOREIGN KEY ("B") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;
