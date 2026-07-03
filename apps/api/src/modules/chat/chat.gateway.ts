import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatService } from './chat.service';
import { SettingsService } from '../settings/settings.service';
import {
  normalizeRoomType,
  socketRoomName,
  toChatMessageDto,
} from './chat-message.mapper';
import { resolvePublicDisplayName } from '../../common/utils/display-name';

interface AuthSocket extends Socket {
  userId?: string;
  userData?: {
    id: string;
    fullName: string | null;
    nickname: string | null;
    mobile: string;
    avatarUrl: string | null;
  };
}

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  /** socketId → userId */
  private readonly connectedUsers = new Map<string, string>();
  /** room name → set of userIds currently in room */
  private readonly roomPresence = new Map<string, Set<string>>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly chatService: ChatService,
    private readonly settings: SettingsService,
  ) {}

  async handleConnection(client: AuthSocket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify<{
        sub: string;
        sessionId: string;
        type: 'access' | 'refresh';
      }>(token, {
        secret: this.config.get<string>(
          'JWT_ACCESS_SECRET',
          'fallback-secret-please-change',
        ),
      });

      if (payload.type !== 'access') {
        client.disconnect();
        return;
      }

      const session = await this.prisma.session.findFirst({
        where: {
          id: payload.sessionId,
          userId: payload.sub,
          revokedAt: { isSet: false },
          expiresAt: { gt: new Date() },
        },
      });

      if (!session) {
        client.disconnect();
        return;
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          mobile: true,
          fullName: true,
          nickname: true,
          avatarUrl: true,
          isBanned: true,
          isMuted: true,
        },
      });

      if (!user || user.isBanned) {
        client.disconnect();
        return;
      }

      client.userId = user.id;
      client.userData = user;
      this.connectedUsers.set(client.id, user.id);

      this.logger.log(`User ${user.id} connected to chat`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthSocket) {
    if (!client.userId) return;

    this.connectedUsers.delete(client.id);
    client.rooms.forEach((room) => {
      if (!room.startsWith('room:')) return;
      this.removeFromRoomPresence(room, client.userId!);
      this.server.to(room).emit('userOffline', { userId: client.userId });
      this.emitOnlineCount(room);
    });
    this.logger.log(`User ${client.userId} disconnected from chat`);
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { roomType: string; teamId?: string },
  ) {
    const roomType = normalizeRoomType(data.roomType);
    if (!roomType) {
      client.emit('error', { message: 'نوع اتاق نامعتبر است' });
      return;
    }

    if (roomType === 'TEAM') {
      if (!data.teamId) {
        client.emit('error', { message: 'teamId لازم است' });
        return;
      }
      const member = await this.prisma.teamMember.findUnique({
        where: {
          teamId_userId: { teamId: data.teamId, userId: client.userId! },
        },
      });
      if (!member) {
        client.emit('error', { message: 'شما عضو این تیم نیستید' });
        return;
      }
    }

    const room = socketRoomName(roomType, data.teamId);
    client.join(room);
    this.addToRoomPresence(room, client.userId!);

    this.server.to(room).emit('userOnline', {
      userId: client.userId,
      userName: resolvePublicDisplayName(client.userData),
      userAvatar: client.userData?.avatarUrl,
    });

    const history =
      roomType === 'GLOBAL'
        ? await this.chatService.getGlobalMessages(1, 50)
        : await this.chatService.getTeamMessages(data.teamId!, client.userId!, 1, 50);

    client.emit('joinedRoom', { room, roomType });
    client.emit(
      'chatHistory',
      history.map((m) => toChatMessageDto(m)),
    );
    client.emit('onlineCount', { count: this.getRoomOnlineCount(room) });
    this.emitOnlineCount(room);
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { roomType: string; teamId?: string },
  ) {
    const roomType = normalizeRoomType(data.roomType);
    if (!roomType || !client.userId) return;

    const room = socketRoomName(roomType, data.teamId);
    client.leave(room);
    this.removeFromRoomPresence(room, client.userId);
    this.server.to(room).emit('userOffline', { userId: client.userId });
    this.emitOnlineCount(room);
  }

  @SubscribeMessage('message')
  async handleMessage(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody()
    data: { roomType: string; teamId?: string; text: string },
  ) {
    if (!client.userId) return;

    const roomType = normalizeRoomType(data.roomType);
    if (!roomType) {
      client.emit('error', { message: 'نوع اتاق نامعتبر است' });
      return;
    }

    const text = (data.text ?? '').trim();
    if (!text) {
      client.emit('error', { message: 'پیام خالی است' });
      return;
    }

    try {
      await this.chatService.validateMessageLength(text);
    } catch (err: any) {
      client.emit('error', { message: err.message ?? 'پیام نامعتبر است' });
      return;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: client.userId },
      select: { isBanned: true, isMuted: true, mutedUntil: true },
    });
    if (user?.isBanned) {
      client.emit('error', { message: 'حساب شما مسدود شده' });
      return;
    }
    if (user?.isMuted && user.mutedUntil && user.mutedUntil > new Date()) {
      client.emit('error', { message: 'شما موقتاً محدود شده‌اید' });
      return;
    }

    const roomId = await this.chatService.resolveRoomId(roomType, data.teamId);

    const rateLimit = Number(await this.settings.get('chat.rateLimit', '5'));
    const oneMinAgo = new Date(Date.now() - 60_000);
    const recentCount = await this.prisma.chatMessage.count({
      where: {
        userId: client.userId,
        roomId,
        createdAt: { gte: oneMinAgo },
      },
    });
    if (recentCount >= rateLimit) {
      client.emit('error', { message: 'سرعت ارسال پیام از حد مجاز بیشتر است' });
      return;
    }

    const message = await this.prisma.chatMessage.create({
      data: {
        userId: client.userId,
        roomId,
        text,
        status: 'NORMAL',
      },
      include: {
        user: {
          select: {
            id: true,
            mobile: true,
            fullName: true,
            nickname: true,
            avatarUrl: true,
            profile: { select: { levelId: true } },
          },
        },
      },
    });

    const room = socketRoomName(roomType, data.teamId);
    this.server.to(room).emit('newMessage', toChatMessageDto(message));
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { roomType: string; teamId?: string },
  ) {
    const roomType = normalizeRoomType(data.roomType);
    if (!roomType) return;

    const room = socketRoomName(roomType, data.teamId);
    client.to(room).emit('typing', {
      userId: client.userId,
      userName: resolvePublicDisplayName(client.userData),
    });
  }

  @SubscribeMessage('report')
  async handleReport(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { messageId: string; reason?: string },
  ) {
    if (!client.userId) return;
    const result = await this.chatService.reportMessage(
      data.messageId,
      client.userId,
      data.reason,
    );
    client.emit('reportAck', { success: true, ...result });
  }

  @OnEvent('notification.inapp')
  handleInAppNotification(payload: {
    userId: string;
    type: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }) {
    for (const [socketId, uid] of this.connectedUsers) {
      if (uid === payload.userId) {
        this.server.to(socketId).emit('notification', {
          type: payload.type,
          title: payload.title,
          body: payload.body,
          data: payload.data ?? {},
        });
      }
    }
  }

  emitMessageHidden(roomType: string, teamId: string | null, messageId: string) {
    const room =
      roomType === 'GLOBAL' ? 'room:global' : `room:team:${teamId}`;
    this.server.to(room).emit('messageHidden', { messageId });
  }

  emitMessageDeleted(roomType: string, teamId: string | null, messageId: string) {
    const room =
      roomType === 'GLOBAL' ? 'room:global' : `room:team:${teamId}`;
    this.server.to(room).emit('messageDeleted', { messageId });
  }

  emitUserMuted(userId: string, until: Date, hours?: number) {
    for (const [socketId, uid] of this.connectedUsers) {
      if (uid === userId) {
        this.server.to(socketId).emit('userMuted', {
          userId,
          until: until.toISOString(),
          user: userId,
          hours: hours ?? Math.ceil((until.getTime() - Date.now()) / 3600_000),
        });
      }
    }
  }

  emitUserKicked(teamId: string, userId: string) {
    const room = `room:team:${teamId}`;
    this.server.to(room).emit('userKicked', { userId, teamId });

    for (const [socketId, uid] of this.connectedUsers) {
      if (uid === userId) {
        const client = this.server.sockets.sockets.get(socketId);
        client?.leave(room);
        client?.emit('userKicked', { userId, teamId });
      }
    }
    this.removeFromRoomPresence(room, userId);
    this.emitOnlineCount(room);
  }

  private addToRoomPresence(room: string, userId: string) {
    if (!this.roomPresence.has(room)) {
      this.roomPresence.set(room, new Set());
    }
    this.roomPresence.get(room)!.add(userId);
  }

  private removeFromRoomPresence(room: string, userId: string) {
    this.roomPresence.get(room)?.delete(userId);
  }

  private getRoomOnlineCount(room: string): number {
    return this.roomPresence.get(room)?.size ?? 0;
  }

  private emitOnlineCount(room: string) {
    this.server.to(room).emit('onlineCount', { count: this.getRoomOnlineCount(room) });
  }
}
