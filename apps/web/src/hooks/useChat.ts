'use client';
import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { joinRoom, leaveRoom, sendMessage, emitTyping } from '@/lib/socket';
import { chatApi } from '@/lib/api/chat';
import { useAuthStore } from '@/store/auth.store';
import { useChatStore } from '@/stores/chatStore';
import type { ChatMessage } from '@/stores/chatStore';
import toast from 'react-hot-toast';

interface UseChatOptions {
  roomType: 'global' | 'team';
  teamId?: string;
}

export function useChat({ roomType, teamId }: UseChatOptions) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const currentUserId = useAuthStore((state) =>
    state.user?.id ? String(state.user.id) : null
  );
  const {
    messages,
    typingUsers,
    onlineCount,
    isConnected,
    addMessage,
    setTypingUser,
    setOnlineCount,
    setConnected,
    setMessages,
    clearTypingUsers,
    resetRoom,
  } = useChatStore();

  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isAuthenticated) {
      resetRoom();
      setConnected(false);
      return;
    }

    resetRoom();

    let socketInstance: ReturnType<typeof import('@/lib/socket').getSocket> | null = null;
    let cancelled = false;
    let cleanup = () => {};

    const normalizeMessage = (raw: Partial<ChatMessage> & {
      id?: string;
      userId?: string;
      userName?: string;
      userAvatar?: string | null;
      text?: string;
      createdAt?: string;
      user?: {
        fullName?: string | null;
        nickname?: string | null;
        mobile?: string | null;
        avatarUrl?: string | null;
      };
    }): ChatMessage => {
      const nestedUser = raw.user;
      const resolvedName =
        (raw.userName ?? nestedUser?.nickname?.trim()) ||
        (nestedUser?.fullName?.trim() && !/^09\d{9}$/.test(nestedUser.fullName.replace(/\s/g, ''))
          ? nestedUser.fullName.trim()
          : undefined) ||
        'کاربر';

      return {
      id: String(raw.id ?? ''),
      userId: String(raw.userId ?? ''),
      userName: resolvedName,
      userAvatar: raw.userAvatar ?? nestedUser?.avatarUrl ?? undefined,
      text: raw.text ?? '',
      createdAt: raw.createdAt ?? new Date().toISOString(),
      roomType,
      teamId,
      isMuted: raw.isMuted,
      isReported: raw.isReported,
    };
    };

    const handleTeamAccessError = (message: string) => {
      if (roomType !== 'team') return false;
      if (!message.includes('عضو این تیم نیستید')) return false;

      toast.error(message);
      router.replace('/community');
      return true;
    };

    // Dynamically import to avoid SSR issues
    const setup = async () => {
      try {
        try {
          const history = roomType === 'global'
            ? await chatApi.getGlobalMessages({ limit: 50 })
            : teamId
              ? await chatApi.getTeamMessages(teamId, { limit: 50 })
              : null;
          const items = (history as { items?: ChatMessage[]; data?: ChatMessage[] })?.items
            ?? (history as { data?: ChatMessage[] })?.data
            ?? (Array.isArray(history) ? history : []);
          if (!cancelled) {
            setMessages((items as ChatMessage[]).map((item) => normalizeMessage(item)));
          }
        } catch (error) {
          if (error instanceof Error) {
            handleTeamAccessError(error.message);
          }
          // history optional if socket delivers chatHistory
        }

        const { getSocket } = await import('@/lib/socket');
        if (cancelled) return;

        socketInstance = getSocket();
        setConnected(socketInstance.connected);

        const joinCurrentRoom = () => {
          joinRoom(roomType, teamId);
        };
        const onConnect = () => {
          setConnected(true);
          joinCurrentRoom();
        };
        const onDisconnect = () => {
          setConnected(false);
          setOnlineCount(0);
          clearTypingUsers();
        };
        const onChatHistory = (msgs: ChatMessage[]) =>
          setMessages(msgs.map((msg) => normalizeMessage(msg)));
        const onNewMessage = (msg: ChatMessage) => addMessage(normalizeMessage(msg));
        const onTyping = (e: { userId: string; userName: string }) => {
          if (currentUserId && e.userId === currentUserId) return;
          setTypingUser(e.userId, e.userName, true);
          setTimeout(() => setTypingUser(e.userId, e.userName, false), 3000);
        };
        const onOnlineCount = (payload: number | { count: number }) => {
          setOnlineCount(typeof payload === 'number' ? payload : payload.count);
        };
        const onUserMuted = (e: { hours?: number }) => {
          const hours = e.hours ?? 1;
          toast.error(`شما برای ${hours} ساعت از چت محروم شدید`);
        };
        const onMessageDeleted = (e: { messageId: string }) => {
          useChatStore.getState().removeMessage(e.messageId);
        };
        const onMessageHidden = (e: { messageId: string }) => {
          useChatStore.getState().removeMessage(e.messageId);
        };
        const onChatError = (e: { message?: string }) => {
          const message = e.message?.trim() || 'خطا در چت';
          const handled = handleTeamAccessError(message);
          if (!handled) {
            toast.error(message);
          }
        };
        const onUserKicked = (e: { userId?: string; teamId?: string }) => {
          if (
            roomType !== 'team' ||
            !currentUserId ||
            e.teamId !== teamId ||
            String(e.userId ?? '') !== currentUserId
          ) {
            return;
          }

          toast.error('از تیم اخراج شدید');
          router.replace('/community');
        };

        socketInstance.on('connect', onConnect);
        socketInstance.on('disconnect', onDisconnect);
        socketInstance.on('chatHistory', onChatHistory);
        socketInstance.on('newMessage', onNewMessage);
        socketInstance.on('typing', onTyping);
        socketInstance.on('onlineCount', onOnlineCount);
        socketInstance.on('userMuted', onUserMuted);
        socketInstance.on('messageDeleted', onMessageDeleted);
        socketInstance.on('messageHidden', onMessageHidden);
        socketInstance.on('error', onChatError);
        socketInstance.on('userKicked', onUserKicked);

        cleanup = () => {
          try {
            leaveRoom(roomType, teamId);
            if (typingTimeout.current) {
              clearTimeout(typingTimeout.current);
            }
            if (socketInstance) {
              socketInstance.off('connect', onConnect);
              socketInstance.off('disconnect', onDisconnect);
              socketInstance.off('chatHistory', onChatHistory);
              socketInstance.off('newMessage', onNewMessage);
              socketInstance.off('typing', onTyping);
              socketInstance.off('onlineCount', onOnlineCount);
              socketInstance.off('userMuted', onUserMuted);
              socketInstance.off('messageDeleted', onMessageDeleted);
              socketInstance.off('messageHidden', onMessageHidden);
              socketInstance.off('error', onChatError);
              socketInstance.off('userKicked', onUserKicked);
            }
          } catch {
            // cleanup
          }
        };

        if (socketInstance.connected) {
          joinCurrentRoom();
        } else {
          socketInstance.connect();
        }
      } catch {
        // socket not available in SSR or during build
        if (!cancelled) {
          setConnected(false);
        }
      }
    };

    void setup();

    return () => {
      cancelled = true;
      cleanup();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomType, teamId, currentUserId, isAuthenticated, router]);

  const send = useCallback(
    (text: string) => {
      try {
        sendMessage(text, roomType, teamId);
      } catch {
        toast.error('خطا در ارسال پیام');
      }
    },
    [roomType, teamId]
  );

  const handleTyping = useCallback(() => {
    try {
      if (typingTimeout.current) return;

      emitTyping(roomType, teamId);
      typingTimeout.current = setTimeout(() => {
        typingTimeout.current = null;
      }, 1500);
    } catch {
      // socket not connected
    }
  }, [roomType, teamId]);

  return {
    messages,
    typingUsers,
    onlineCount,
    isConnected,
    send,
    handleTyping,
  };
}
