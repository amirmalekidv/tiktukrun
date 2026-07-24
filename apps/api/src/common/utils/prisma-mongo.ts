/**
 * Prisma MongoDB soft-delete helpers.
 *
 * Unset optional DateTime fields are returned as `null` when reading, but
 * `where: { deletedAt: null }` does NOT match those documents. Use `isSet`
 * (and optional explicit null) instead — same pattern as OtpService.
 */
export function notSoftDeletedWhere() {
  return {
    OR: [{ deletedAt: { equals: null } }, { deletedAt: { isSet: false } }],
  };
}
