const BASE = process.env.NEXT_PUBLIC_API_URL || '';

function authHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const leaderboardApi = {
  getLeaderboard: async (period: 'week' | 'month' | 'all' = 'week', page = 1) => {
    const res = await fetch(
      `${BASE}/api/v1/leaderboard?period=${period}&page=${page}`,
      { headers: authHeaders() }
    );
    if (!res.ok) throw new Error('Failed to fetch leaderboard');
    return res.json();
    // Returns: { entries: [{ rank, userId, name, avatar, level, xp, badge }], myRank, total }
  },

  getMyRank: async () => {
    const res = await fetch(`${BASE}/api/v1/leaderboard/me`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch my rank');
    return res.json();
  },
};
