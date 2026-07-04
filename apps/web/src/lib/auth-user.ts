import type { User } from '@/types'

import { maskMobile } from './utils'

export function normalizeAuthUser(raw: any): User {
  const mobile = String(raw?.mobile ?? '')
  return {
    id: String(raw?.id ?? ''),
    mobile,
    name: raw?.name ?? raw?.fullName ?? raw?.profile?.displayName ?? (mobile ? maskMobile(mobile) : 'کاربر TIK TAK RUN'),
    avatar: raw?.avatar ?? raw?.avatarUrl ?? undefined,
    walletBalance: Number(raw?.walletBalance ?? raw?.wallet?.tomanBalance ?? raw?.wallet?.balance ?? 0),
    xp: Number(raw?.xp ?? raw?.profile?.xp ?? 0),
    rank: Number(raw?.rank ?? 0),
    totalBookings: Number(raw?.totalBookings ?? raw?.bookingsCount ?? 0),
    successRate: Number(raw?.successRate ?? 0),
    inviteCode: String(raw?.inviteCode ?? ''),
    createdAt: String(raw?.createdAt ?? new Date(0).toISOString()),
  }
}
