# TIK TAK RUN — Prisma + MongoDB

## Overview

This folder is the canonical database setup for the API:

- `schema.prisma` — MongoDB schema used by Prisma
- `seed.mongo.ts` — Mongo-compatible seed implementation
- `seed.ts` — compatibility entrypoint that delegates to `seed.mongo.ts`
- `scripts/validate-schema.ts` — MongoDB validation checks
- `scripts/smoke-transaction.ts` — replica-set transaction smoke test
- `scripts/backup-dump.sh` — `mongodump` / `mongorestore` helper

PostgreSQL migration artifacts are no longer active in the runtime flow. The
project uses `prisma db push` against MongoDB instead of `prisma migrate`.

## Prerequisites

MongoDB must run as a replica set because Prisma transactions require it.

Example connection string:

```env
DATABASE_URL="mongodb://tiktakrun:secret@127.0.0.1:27017/tiktakrun_db?authSource=admin&replicaSet=rs0&directConnection=true"
```

When using Docker Compose in this repo, the `mongo` + `mongo-init` services
bootstrap a single-node `rs0` replica set automatically.

## Common commands

```bash
# Generate Prisma client
pnpm --filter @tiktakrun/api prisma:generate

# Validate schema syntax
pnpm --filter @tiktakrun/api prisma:validate

# Push schema to MongoDB
pnpm --filter @tiktakrun/api db:push

# Seed MongoDB
pnpm --filter @tiktakrun/api db:seed

# Force reset + re-seed
pnpm --filter @tiktakrun/api db:reset

# Validate MongoDB setup + seed integrity
pnpm --filter @tiktakrun/api db:validate

# Smoke test Prisma transactions on rs0
pnpm --filter @tiktakrun/api db:smoke:transaction
```

## Recommended bootstrap flow

```bash
pnpm --filter @tiktakrun/api prisma:generate
pnpm --filter @tiktakrun/api db:push
pnpm --filter @tiktakrun/api db:seed
pnpm --filter @tiktakrun/api db:validate
pnpm --filter @tiktakrun/api db:smoke:transaction
```

## Backups

Create a compressed MongoDB archive:

```bash
cd apps/api
bash prisma/scripts/backup-dump.sh
```

Restore from an archive:

```bash
cd apps/api
bash prisma/scripts/backup-dump.sh --restore ./backups/tiktakrun_YYYYMMDD_HHMMSS.archive.gz
```

## Notes

- If `db:smoke:transaction` fails with a transaction/session error, verify that
  MongoDB is running with `replicaSet=rs0`.
- `prisma migrate` is intentionally not part of the active MongoDB workflow.
- Keep shared enums in `packages/shared-types` aligned with this schema before
  wiring new API/frontend features.
