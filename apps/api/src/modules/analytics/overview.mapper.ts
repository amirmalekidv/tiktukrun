const CATEGORY_COLORS = [
  '#ef4444', '#3b82f6', '#22c55e', '#f97316', '#a855f7', '#06b6d4',
];

function kpi(
  label: string,
  rawValue: number,
  change: number,
  icon: string,
  color: string,
  target?: number,
) {
  const changeType =
    change > 0 ? 'increase' : change < 0 ? 'decrease' : 'neutral';
  return {
    label,
    value: rawValue.toLocaleString('fa-IR'),
    rawValue,
    change,
    changeType,
    target,
    targetPercent: target && target > 0 ? Math.round((rawValue / target) * 100) : undefined,
    icon,
    color,
    trend: [],
  };
}

export function mapOverviewToDashboard(
  flat: Record<string, any>,
  financial?: Record<string, any>,
) {
  const revenueTrend = flat.revenueTrend ?? [];
  const categoryBreakdown = flat.categoryBreakdown ?? [];
  const recentBookings = (flat.recentBookings ?? []).map((b: any) => ({
    id: String(b.id),
    customerId: String(b.userId ?? b.user?.id ?? ''),
    customerName: b.user?.fullName ?? '—',
    gameId: String(b.gameId ?? ''),
    gameName: b.game?.title ?? '—',
    branchName: b.branch?.name ?? '',
    status: b.status,
    scheduledAt: b.scheduledAt,
    participants: b.participants ?? 1,
    totalAmount: Number(b.totalAmount ?? 0),
    paidAmount: Number(b.paidAmount ?? b.totalAmount ?? 0),
    createdAt: b.createdAt,
  }));

  const totalBookingsMonth = revenueTrend.reduce(
    (sum: number, _d: any, _i: number, arr: any[]) => sum + (arr.length > 0 ? 1 : 0),
    0,
  );
  const conversionRate =
    flat.newCustomers > 0
      ? Math.round((recentBookings.length / Math.max(flat.newCustomers, 1)) * 100)
      : 0;

  return {
    kpis: {
      monthlyRevenue: kpi(
        'درآمد ماهانه',
        flat.monthlyRevenue ?? 0,
        flat.revenueChange ?? 0,
        'dollar',
        '#22c55e',
        flat.revenueTarget,
      ),
      newCustomers: kpi(
        'مشتریان جدید',
        flat.newCustomers ?? 0,
        flat.newCustomersChange ?? 0,
        'users',
        '#3b82f6',
      ),
      activeBookings: kpi(
        'رزروهای فعال',
        flat.activeBookings ?? 0,
        0,
        'calendar',
        '#f97316',
      ),
      conversionRate: kpi(
        'نرخ تبدیل',
        conversionRate,
        0,
        'percent',
        '#a855f7',
      ),
    },
    revenueChart: revenueTrend.map((d: any) => ({
      date: d.date,
      revenue: d.revenue ?? 0,
      bookings: d.bookings ?? 0,
    })),
    categoryStats: categoryBreakdown.map((c: any, i: number) => ({
      name: c.name,
      count: c.count ?? 0,
      revenue: c.revenue ?? 0,
      color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    })),
    acquisitionSources: [
      { source: 'مستقیم', count: flat.newCustomers ?? 0, percent: 60 },
      { source: 'دعوت', count: Math.round((flat.newCustomers ?? 0) * 0.2), percent: 20 },
      { source: 'شبکه‌های اجتماعی', count: Math.round((flat.newCustomers ?? 0) * 0.2), percent: 20 },
    ],
    topCustomers: (flat.topCustomers ?? []).map((c: any) => ({
      id: String(c.id),
      name: c.name ?? '—',
      mobile: c.mobile ?? '',
      tier: 'BRONZE' as const,
      status: 'ACTIVE' as const,
      level: 1,
      xp: 0,
      xpForNextLevel: 100,
      ltv: c.ltv ?? 0,
      totalBookings: 0,
      avgRating: 0,
      lastActiveAt: new Date().toISOString(),
      registeredAt: new Date().toISOString(),
      walletBalance: 0,
      coins: 0,
      totalReferrals: 0,
    })),
    recentBookings,
    financialKpis: {
      cac: financial?.cac ?? 0,
      clv: financial?.clv ?? financial?.avgLTV ?? 0,
      churnRate: financial?.churnRate ?? 0,
      nps: financial?.nps ?? 0,
    },
    liveActivities: flat.liveActivities ?? [],
  };
}
