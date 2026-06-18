const BASE = process.env.NEXT_PUBLIC_API_URL || '';

function authHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const wheelApi = {
  getPrizes: async () => {
    const res = await fetch(`${BASE}/api/v1/wheel/prizes`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch wheel prizes');
    return res.json();
  },

  getEligibility: async () => {
    const res = await fetch(`${BASE}/api/v1/wheel/eligibility`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch eligibility');
    return res.json();
    // Returns: { canSpinWithXp, canSpinWithCoins, canSpinWithDiamonds, nextSpinAt }
  },

  spin: async (paidWith: 'xp' | 'coins' | 'diamonds') => {
    const res = await fetch(`${BASE}/api/v1/wheel/spin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ paidWith }),
    });
    if (!res.ok) throw new Error('Failed to spin wheel');
    return res.json();
    // Returns: { prize: { id, label, type, value }, transaction }
  },

  getHistory: async (page = 1) => {
    const res = await fetch(`${BASE}/api/v1/wheel/history?page=${page}`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch wheel history');
    return res.json();
  },
};
