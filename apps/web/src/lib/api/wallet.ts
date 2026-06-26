import { apiFetch } from '../http';

export const walletApi = {
  getWallet: () => apiFetch('/wallet/me'),
  getTransactions: (params?: { page?: number; limit?: number; type?: string }) => {
    const q = new URLSearchParams({
      page: String(params?.page ?? 1),
      limit: String(params?.limit ?? 20),
      ...(params?.type ? { type: params.type } : {}),
    });
    return apiFetch(`/wallet/me/transactions?${q}`);
  },
  chargeWallet: (amount: number) =>
    apiFetch<{ paymentUrl: string; authority: string }>('/wallet/charge', {
      method: 'POST',
      body: JSON.stringify({ amount, method: 'ZARINPAL' }),
    }),
  getDiamondPackages: () => apiFetch('/wallet/packages/diamonds'),
  getCoinPackages: () => apiFetch('/wallet/packages/coins'),
  purchaseDiamonds: (packageId: string) =>
    apiFetch('/wallet/purchase-diamonds', {
      method: 'POST',
      body: JSON.stringify({ packageId }),
    }),
  purchaseCoins: (packageId: string) =>
    apiFetch('/wallet/purchase-coins', {
      method: 'POST',
      body: JSON.stringify({ packageId }),
    }),
  convertXp: (amount: number) =>
    apiFetch('/wallet/convert', {
      method: 'POST',
      body: JSON.stringify({ from: 'XP', to: 'COINS', amount }),
    }),
  purchasePackage: (packageId: string) =>
    apiFetch('/wallet/purchase-diamonds', {
      method: 'POST',
      body: JSON.stringify({ packageId }),
    }),
};
