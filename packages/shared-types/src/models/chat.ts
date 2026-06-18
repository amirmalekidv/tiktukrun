/**
 * Chat & Team Models — TIK TAK RUN Shared Types
 */

import type { ChatRoomType, ChatMessageStatus, TeamStatus, TeamMemberRole, ModerationActionType } from '../enums';
import type { User } from './user';

export interface ChatRoom {
  id: number;
  type: ChatRoomType;
  name?: string;
  teamId?: number;
  isActive: boolean;
  createdAt: string;
}

export interface ChatMessage {
  id: number;
  roomId: number;
  userId: number;
  text: string;
  status: ChatMessageStatus;
  reportsCount: number;
  parentMessageId?: number;
  createdAt: string;
  deletedAt?: string;

  // Relations
  user?: Pick<User, 'id' | 'fullName' | 'nickname' | 'avatarUrl'>;
  replies?: ChatMessage[];
}

export interface ChatModerationAction {
  id: number;
  messageId?: number;
  userId: number;
  moderatorId: number;
  action: ModerationActionType;
  reason?: string;
  createdAt: string;
}

export interface Team {
  id: number;
  name: string;
  gameId: number;
  branchId?: number;
  captainId: number;
  capacity: number;
  slotDateTime?: string;
  status: TeamStatus;
  description?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;

  // Relations
  members?: TeamMember[];
  captain?: Pick<User, 'id' | 'fullName' | 'avatarUrl' | 'nickname'>;
}

export interface TeamMember {
  teamId: number;
  userId: number;
  joinedAt: string;
  role: TeamMemberRole;

  user?: Pick<User, 'id' | 'fullName' | 'avatarUrl' | 'nickname'>;
}

/** تیم با اطلاعات کامل */
export interface TeamDetail extends Team {
  captain: Pick<User, 'id' | 'fullName' | 'avatarUrl' | 'nickname'>;
  members: TeamMember[];
  game?: {
    id: number;
    title: string;
    slug: string;
    coverImage?: string;
  };
  chatRoom?: ChatRoom;
  currentMemberCount: number;
  availableSlots: number;
}
