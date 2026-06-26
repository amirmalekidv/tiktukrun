import { apiFetch } from '../http';

export const wheelApi = {
  getPrizes: () => apiFetch('/wheel/prizes'),
  getEligibility: () => apiFetch('/wheel/eligibility'),
  spin: (paidWith: 'XP' | 'COINS' | 'DIAMONDS' | 'xp' | 'coins' | 'diamonds') =>
    apiFetch('/wheel/spin', {
      method: 'POST',
      body: JSON.stringify({
        paidWith: String(paidWith).toUpperCase(),
      }),
    }),
  getHistory: (page = 1) => apiFetch(`/wheel/history?page=${page}`),
};
