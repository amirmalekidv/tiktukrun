const BASE = process.env.NEXT_PUBLIC_API_URL || '';

function authHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const invitesApi = {
  getMyInvite: async () => {
    const res = await fetch(`${BASE}/api/v1/invites/me`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch invite info');
    return res.json();
    // Returns: { code, usageCount, totalXpEarned, invitedUsers: [] }
  },

  getInvitedUsers: async (page = 1) => {
    const res = await fetch(
      `${BASE}/api/v1/invites/me/users?page=${page}`,
      { headers: authHeaders() }
    );
    if (!res.ok) throw new Error('Failed to fetch invited users');
    return res.json();
  },

  regenerateCode: async () => {
    const res = await fetch(`${BASE}/api/v1/invites/regenerate`, {
      method: 'POST',
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to regenerate code');
    return res.json();
  },
};
