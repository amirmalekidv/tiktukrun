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
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatService } from './chat.service';
import { SettingsService } from '../settings/settings.service';

interface AuthSocket extends Socket {
  userId?: string;
  userData?: any;
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
  private readonly connectedUsers = new Map<string, string>(); // socketId → userId

  constructor(
    private readonly jwtService: JwtService,
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

      const payload = this.jwtService.verify(token);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, fullName: true, avatarUrl: true, isBanned: true, isMuted: true },
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
    if (client.userId) {
      this.connectedUsers.delete(client.id);
      // Emit offline to all joined rooms
      client.rooms.forEach((room) => {
        this.server.to(room).emit('userOffline', { userId: client.userId });
      });
      this.logger.log(`User ${client.userId} disconnected from chat`);
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { roomType: 'GLOBAL' | 'TEAM'; teamId?: string },
  ) {
    const room =
      data.roomType === 'GLOBAL' ? 'room:global' : `room:team:${data.teamId}`;

    if (data.roomType === 'TEAM' && data.teamId) {
      // Verify membership
      const member = await this.prisma.teamMember.findUnique({
        where: {
          teamId_userId: { teamId: data.teamId, userId: client.userId },
        },
      });
      if (!member) {
        client.emit('error', { message: 'شما عضو این تیم نیستید' });
        return;
      }
    }

    client.join(room);
    this.server.to(room).emit('userOnline', {
      userId: client.userId,
      name: client.userData?.name,
      avatar: client.userData?.avatar,
    });

    client.emit('joinedRoom', { room, roomType: data.roomType });
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { roomType: 'GLOBAL' | 'TEAM'; teamId?: string },
  ) {
    const room =
      data.roomType === 'GLOBAL' ? 'room:global' : `room:team:${data.teamId}`;
    client.leave(room);
    this.server.to(room).emit('userOffline', { userId: client.userId });
  }

  @SubscribeMessage('message')
  async handleMessage(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody()
    data: { roomType: 'GLOBAL' | 'TEAM'; teamId?: string; text: string },
  ) {
    if (!client.userId) return;

    // Server-side ban check
    const user = await this.prisma.user.findUnique({
      where: { id: client.userId },
      select: { isBanned: true, isMuted: true, mutedUntil: true },
    });
    if (user?.isBanned) {
      client.emit('error', { message: 'حساب شما مسدود شده' });
      return;
    }
    if (user?.isMuted && user.mutedUntil > new Date()) {
      client.emit('error', { message: 'شما موقتاً محدود شده‌اید' });
      return;
    }

    // Resolve room id (room-based MongoDB schema)
    const roomId = await this.chatService.resolveRoomId(
      data.roomType,
      data.teamId,
    );

    // Rate limit check
    const rateLimit = Number(
      await this.settings.get('chat.rateLimit', '5'),
    );
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

    // Create message
    const message = await this.prisma.chatMessage.create({
      data: {
        userId: client.userId,
        roomId,
        text: data.text,
        status: 'NORMAL',
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            profile: { select: { levelId: true } },
          },
        },
      },
    });

    const room =
      data.roomType === 'GLOBAL' ? 'room:global' : `room:team:${data.teamId}`;

    this.server.to(room).emit('newMessage', message);
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { roomType: 'GLOBAL' | 'TEAM'; teamId?: string },
  ) {
    const room =
      data.roomType === 'GLOBAL' ? 'room:global' : `room:team:${data.teamId}`;
    client.to(room).emit('typing', {
      userId: client.userId,
      name: client.userData?.name,
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

  // Server-side emit helpers (called by admin actions)
  emitMessageHidden(roomType: string, teamId: string | null, messageId: string) {
    const room = roomType === 'GLOBAL' ? 'room:global' : `room:team:${teamId}`;
    this.server.to(room).emit('messageHidden', { messageId });
  }

  emitMessageDeleted(roomType: string, teamId: string | null, messageId: string) {
    const room = roomType === 'GLOBAL' ? 'room:global' : `room:team:${teamId}`;
    this.server.to(room).emit('messageDeleted', { messageId });
  }

  emitUserMuted(userId: string, until: Date) {
    // Find socket by userId and emit
    for (const [socketId, uid] of this.connectedUsers) {
      if (uid === userId) {
        this.server.to(socketId).emit('userMuted', { userId, until });
      }
    }
  }

  emitUserKicked(teamId: string, userId: string) {
    const room = `room:team:${teamId}`;
    this.server.to(room).emit('userKicked', { userId });
  }
}
