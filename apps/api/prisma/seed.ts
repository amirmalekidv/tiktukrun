/**
 * Canonical MongoDB seed entrypoint.
 *
 * The old PostgreSQL-oriented implementation used `TRUNCATE TABLE`, which is
 * not valid on MongoDB. Keep this file as the stable entrypoint and delegate
 * to the Mongo-compatible implementation so existing docs/scripts continue to
 * work with `ts-node prisma/seed.ts`.
 */

import './seed.mongo';
