/** Read paginated list from axios response (API → { success, data: T[], meta }). */
export function readPaginatedList<T>(res: {
  data?: { data?: T[]; meta?: { total?: number } } | T[];
}): { items: T[]; total: number } {
  const body = res?.data;
  if (Array.isArray(body)) {
    return { items: body, total: body.length };
  }
  const items = Array.isArray(body?.data) ? body.data : [];
  const total = body?.meta?.total ?? items.length;
  return { items, total };
}
