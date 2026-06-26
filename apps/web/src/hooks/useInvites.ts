'use client';
import useSWR from 'swr';
import { invitesApi } from '@/lib/api/invites';

export function useInvites() {
  const { data, error, isLoading, mutate } = useSWR(
    'invites-me',
    () => invitesApi.getMyInvite().catch(() => null)
  );

  const { data: usersData, isLoading: usersLoading } = useSWR(
    'invites-users',
    () => invitesApi.getInvitedUsers().catch(() => null)
  );

  const inviteData = data as {
    code?: string;
    usageCount?: number;
    totalXpEarned?: number;
    totalUses?: number;
    totalRewardXp?: number;
  } | null | undefined;
  const usersPayload = usersData as { users?: unknown[] } | null | undefined;

  const shareLink = inviteData?.code
    ? `${process.env.NEXT_PUBLIC_APP_URL || ''}/invite/${inviteData.code}`
    : '';

  return {
    invite: inviteData
      ? {
          ...inviteData,
          usageCount: inviteData.usageCount ?? inviteData.totalUses ?? 0,
          totalXpEarned: inviteData.totalXpEarned ?? inviteData.totalRewardXp ?? 0,
        }
      : null,
    shareLink,
    invitedUsers: usersPayload?.users ?? [],
    isLoading,
    usersLoading,
    error,
    mutate,
  };
}
