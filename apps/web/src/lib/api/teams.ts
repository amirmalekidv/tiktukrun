const BASE = process.env.NEXT_PUBLIC_API_URL || '';

function authHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const teamsApi = {
  getActiveTeams: async () => {
    const res = await fetch(`${BASE}/api/v1/teams?status=FORMING`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch teams');
    return res.json();
  },

  getTeam: async (teamId: string) => {
    const res = await fetch(`${BASE}/api/v1/teams/${teamId}`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch team');
    return res.json();
  },

  createTeam: async (data: {
    name: string;
    description?: string;
    maxMembers: number;
    gameType?: string;
  }) => {
    const res = await fetch(`${BASE}/api/v1/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create team');
    return res.json();
  },

  joinTeam: async (teamId: string) => {
    const res = await fetch(`${BASE}/api/v1/teams/${teamId}/join`, {
      method: 'POST',
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to join team');
    return res.json();
  },

  leaveTeam: async (teamId: string) => {
    const res = await fetch(`${BASE}/api/v1/teams/${teamId}/leave`, {
      method: 'POST',
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to leave team');
    return res.json();
  },

  getTeamMessages: async (teamId: string, before?: string) => {
    const query = before ? `?before=${before}` : '';
    const res = await fetch(`${BASE}/api/v1/teams/${teamId}/messages${query}`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch team messages');
    return res.json();
  },
};
