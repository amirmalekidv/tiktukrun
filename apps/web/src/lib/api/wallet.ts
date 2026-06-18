const BASE = process.env.NEXT_PUBLIC_API_URL || '';

function authHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const walletApi = {
  getWallet: async () => {
    const res = await fetch(`${BASE}/api/v1/wallet`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch wallet');
    return res.json();
  },

  getTransactions: async (params?: {
    page?: number;
    limit?: number;
    type?: string;
  }) => {
    const query = new URLSearchParams({
      page: String(params?.page ?? 1),
      limit: String(params?.limit ?? 20),
      ...(params?.type ? { type: params.type } : {}),
    });
    const res = await fetch(`${BASE}/api/v1/wallet/transactions?${query}`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch transactions');
    return res.json();
  },

  chargeWallet: async (amount: number) => {
    const res = await fetch(`${BASE}/api/v1/wallet/charge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ amount }),
    });
    if (!res.ok) throw new Error('Failed to initiate charge');
    return res.json(); // { paymentUrl, authority }
  },

  verifyCharge: async (authority: string, status: string) => {
    const res = await fetch(`${BASE}/api/v1/wallet/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ authority, status }),
    });
    if (!res.ok) throw new Error('Failed to verify payment');
    return res.json();
  },

  getDiamondPackages: async () => {
    const res = await fetch(`${BASE}/api/v1/wallet/packages?type=diamonds`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch diamond packages');
    return res.json();
  },

  getCoinPackages: async () => {
    const res = await fetch(`${BASE}/api/v1/wallet/packages?type=coins`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch coin packages');
    return res.json();
  },

  purchasePackage: async (packageId: string) => {
    const res = await fetch(`${BASE}/api/v1/wallet/purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ packageId }),
    });
    if (!res.ok) throw new Error('Failed to purchase package');
    return res.json();
  },

  convertXp: async (xpAmount: number) => {
    const res = await fetch(`${BASE}/api/v1/wallet/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ xpAmount }),
    });
    if (!res.ok) throw new Error('Failed to convert XP');
    return res.json();
  },
};
