const BASE = process.env.NEXT_PUBLIC_API_URL || '';

function authHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const profileApi = {
  getMe: async () => {
    const res = await fetch(`${BASE}/api/v1/profile/me`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch profile');
    return res.json();
  },

  getPublicProfile: async (userId: string) => {
    const res = await fetch(`${BASE}/api/v1/profile/${userId}`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch public profile');
    return res.json();
  },

  updateProfile: async (data: {
    nickname?: string;
    bio?: string;
    city?: string;
    email?: string;
  }) => {
    const res = await fetch(`${BASE}/api/v1/profile/me`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
  },

  getBadges: async () => {
    const res = await fetch(`${BASE}/api/v1/profile/badges`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch badges');
    return res.json();
  },

  getStats: async () => {
    const res = await fetch(`${BASE}/api/v1/profile/stats`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  // Avatar
  getAvatarItems: async () => {
    const res = await fetch(`${BASE}/api/v1/avatar/items`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch avatar items');
    return res.json();
  },

  getAvatarConfig: async () => {
    const res = await fetch(`${BASE}/api/v1/avatar/config`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch avatar config');
    return res.json();
  },

  updateAvatarConfig: async (config: {
    hat?: string;
    glasses?: string;
    skin?: string;
    effect?: string;
    background?: string;
  }) => {
    const res = await fetch(`${BASE}/api/v1/avatar/config`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(config),
    });
    if (!res.ok) throw new Error('Failed to update avatar config');
    return res.json();
  },

  purchaseAvatarItem: async (itemId: string) => {
    const res = await fetch(`${BASE}/api/v1/avatar/purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ itemId }),
    });
    if (!res.ok) throw new Error('Failed to purchase avatar item');
    return res.json();
  },
};
