import type { ChatMessageDto } from '@tiktakrun/shared-types';

/** Map Prisma chat message (with user include) to stable socket/REST DTO. */
export function toChatMessageDto(message: {
  id: string;
  roomId: string;
  userId: string;
  text: string;
  status: string;
  reportsCount?: number | null;
  createdAt: Date;
  user?: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
    profile?: { levelId?: number | null } | null;
  } | null;
}): ChatMessageDto {
  return {
    id: message.id,
    roomId: message.roomId,
    userId: message.userId,
    userName: message.user?.fullName ?? 'کاربر',
    userAvatar: message.user?.avatarUrl ?? null,
    text: message.text,
    status: message.status,
    reportsCount: message.reportsCount ?? 0,
    createdAt: message.createdAt.toISOString(),
    levelId: message.user?.profile?.levelId ?? undefined,
  };
}

/** Accept global/team in any casing from clients. */
export function normalizeRoomType(raw: string | undefined): 'GLOBAL' | 'TEAM' | null {
  if (!raw) return null;
  const upper = raw.toUpperCase();
  if (upper === 'GLOBAL' || upper === 'TEAM') return upper;
  return null;
}

export function socketRoomName(roomType: 'GLOBAL' | 'TEAM', teamId?: string): string {
  return roomType === 'GLOBAL' ? 'room:global' : `room:team:${teamId}`;
}
