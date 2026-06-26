import { apiFetch } from '../http';

export const leaderboardApi = {
  getLeaderboard: (typeOrParams?: string | { type?: string; limit?: number }, limit = 50) => {
    const params =
      typeof typeOrParams === 'object' && typeOrParams !== null
        ? typeOrParams
        : { type: typeOrParams, limit };
    const q = new URLSearchParams({
      ...(params.type ? { type: params.type } : {}),
      limit: String(params.limit ?? limit),
    });
    return apiFetch(`/profile/leaderboard?${q}`);
  },
  getMyRank: (type?: string) => {
    const q = type ? `?type=${type}` : '';
    return apiFetch(`/profile/leaderboard/me${q}`);
  },
};
