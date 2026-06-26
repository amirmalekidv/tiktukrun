/**
 * WebSocket wire-format DTO for chat messages.
 * Stable contract between chat gateway and web/admin clients.
 */
export interface ChatMessageDto {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  text: string;
  status: string;
  reportsCount: number;
  createdAt: string;
  levelId?: number;
}

export type ChatRoomTypeWire = 'GLOBAL' | 'TEAM';

export interface ChatJoinPayload {
  roomType: ChatRoomTypeWire | string;
  teamId?: string;
}
