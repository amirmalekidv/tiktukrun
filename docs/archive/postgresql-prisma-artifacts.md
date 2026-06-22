# PostgreSQL Prisma Artifacts

MongoDB is the canonical datastore for this project as of Phase 0 completion.
The active database workflow is:

- `prisma db push`
- MongoDB replica set `rs0`
- `seed.mongo.ts`
- `mongodump` / `mongorestore`

The old PostgreSQL-specific Prisma artifacts were removed from the active tree
to avoid drift and accidental use:

- `apps/api/prisma/schema.postgres.prisma.bak`
- `apps/api/prisma/migrations/20260101000000_init/migration.sql`
- `apps/api/prisma/migrations/20260102000000_fix_monthly_winner/migration.sql`
- `apps/api/prisma/migrations/migration_lock.toml`
- `apps/api/prisma/scripts/sample-queries.sql`

Their historical contents remain available in version control if they ever need
to be referenced for migration archaeology.
