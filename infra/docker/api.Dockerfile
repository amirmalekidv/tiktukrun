# ═══════════════════════════════════════════════════════════════════════════
# TIK TAK RUN — API Dockerfile (NestJS + Prisma)
# Multi-stage build for minimal production image
# ═══════════════════════════════════════════════════════════════════════════

# ─── Stage 1: Dependencies ──────────────────────────────────────────────────
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@9.10.0 --activate

# Copy workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared-types/package.json ./packages/shared-types/

# Install dependencies (production + dev for building)
RUN pnpm install --frozen-lockfile || pnpm install

# ─── Stage 2: Builder ───────────────────────────────────────────────────────
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.10.0 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules 2>/dev/null || true
COPY --from=deps /app/packages/shared-types/node_modules ./packages/shared-types/node_modules 2>/dev/null || true

# Copy source
COPY . .

# Generate Prisma client
RUN cd apps/api && npx prisma generate

# Build shared-types first, then API
RUN pnpm --filter @tiktakrun/shared-types build 2>/dev/null || true
RUN pnpm --filter @tiktakrun/api build

# ─── Stage 3: Production Runner ─────────────────────────────────────────────
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat openssl wget tini
WORKDIR /app

ENV NODE_ENV=production
ENV TZ=Asia/Tehran

# Non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

# Copy built application and required runtime files
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/package.json ./
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/prisma ./prisma
COPY --from=builder --chown=nestjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma 2>/dev/null || true
COPY --from=builder --chown=nestjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma 2>/dev/null || true

USER nestjs

EXPOSE 4000

# Use tini as init system (handles signals properly)
ENTRYPOINT ["/sbin/tini", "--"]

# On startup: sync schema to MongoDB (db push — migrate not supported on Mongo) then start
CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/main"]
