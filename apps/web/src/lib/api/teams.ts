import { apiFetch } from '../http';
import { chatApi } from './chat';

export const teamsApi = {
  getActiveTeams: () => apiFetch('/teams?status=FORMING'),
  getTeam: (teamId: string) => apiFetch(`/teams/${teamId}`),
  createTeam: (data: {
    name: string;
    description?: string;
    maxMembers: number;
    gameType?: string;
  }) =>
    apiFetch('/teams', { method: 'POST', body: JSON.stringify(data) }),
  joinTeam: (teamId: string) =>
    apiFetch(`/teams/${teamId}/join`, { method: 'POST' }),
  leaveTeam: (teamId: string) =>
    apiFetch(`/teams/${teamId}/leave`, { method: 'POST' }),
  getTeamMessages: (teamId: string, page = 1) =>
    chatApi.getTeamMessages(teamId, { page, limit: 50 }),
};
