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

  const shareLink = data?.code
    ? `${process.env.NEXT_PUBLIC_APP_URL || ''}/invite/${data.code}`
    : '';

  return {
    invite: data ?? null,
    shareLink,
    invitedUsers: usersData?.users ?? [],
    isLoading,
    usersLoading,
    error,
    mutate,
  };
}
