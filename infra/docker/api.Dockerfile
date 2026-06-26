# ═══════════════════════════════════════════════════════════════════════════
# TIK TAK RUN — API Dockerfile (NestJS + Prisma)
# Multi-stage build for minimal production image
# ═══════════════════════════════════════════════════════════════════════════

# ─── Stage 1: Dependencies (cache layer) ────────────────────────────────────
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.10.0 --activate

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared-types/package.json ./packages/shared-types/

RUN pnpm install --frozen-lockfile || pnpm install

# ─── Stage 2: Builder ───────────────────────────────────────────────────────
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.10.0 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm install --frozen-lockfile --prefer-offline || pnpm install

RUN pnpm --filter @tiktakrun/api exec prisma generate
RUN pnpm --filter @tiktakrun/shared-types build 2>/dev/null || true
RUN cd apps/api && pnpm exec nest build

# Flatten production deps (avoids broken pnpm symlinks in the runner stage)
FROM builder AS deploy
WORKDIR /app
RUN pnpm --filter @tiktakrun/api deploy --prod /prod/api

# ─── Stage 3: Production Runner ─────────────────────────────────────────────
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat openssl wget tini
RUN npm install -g prisma@5.22.0
WORKDIR /app

ENV NODE_ENV=production
ENV TZ=Asia/Tehran

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

COPY --from=deploy --chown=nestjs:nodejs /prod/api/node_modules ./node_modules
COPY --from=deploy --chown=nestjs:nodejs /prod/api/package.json ./package.json
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/prisma ./prisma

USER nestjs

EXPOSE 4000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["sh", "-c", "prisma db push --skip-generate && node dist/apps/api/src/main"]
