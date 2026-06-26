'use client';
import { useEffect, useCallback, useRef } from 'react';
import { joinRoom, leaveRoom, sendMessage, emitTyping } from '@/lib/socket';
import { chatApi } from '@/lib/api/chat';
import { useChatStore } from '@/stores/chatStore';
import type { ChatMessage } from '@/stores/chatStore';
import toast from 'react-hot-toast';

interface UseChatOptions {
  roomType: 'global' | 'team';
  teamId?: string;
}

export function useChat({ roomType, teamId }: UseChatOptions) {
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
  } = useChatStore();

  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let socketInstance: ReturnType<typeof import('@/lib/socket').getSocket> | null = null;

    // Dynamically import to avoid SSR issues
    const setup = async () => {
      try {
        const { getSocket } = await import('@/lib/socket');
        socketInstance = getSocket();

        setConnected(socketInstance.connected);

        const onConnect = () => setConnected(true);
        const onDisconnect = () => setConnected(false);
        const onChatHistory = (msgs: ChatMessage[]) => setMessages(msgs);
        const onNewMessage = (msg: ChatMessage) => addMessage(msg);
        const onTyping = (e: { userId: string; userName: string }) => {
          setTypingUser(e.userId, e.userName, true);
          // auto clear typing after 3s
          setTimeout(() => setTypingUser(e.userId, e.userName, false), 3000);
        };
        const onOnlineCount = (payload: number | { count: number }) => {
          setOnlineCount(typeof payload === 'number' ? payload : payload.count);
        };
        const onUserMuted = (e: { user: string; hours: number }) => {
          toast.error(`${e.user} برای ${e.hours} ساعت سکوت شد`);
        };
        const onMessageDeleted = (e: { messageId: string }) => {
          useChatStore.getState().removeMessage(e.messageId);
        };

        socketInstance.on('connect', onConnect);
        socketInstance.on('disconnect', onDisconnect);
        socketInstance.on('chatHistory', onChatHistory);
        socketInstance.on('newMessage', onNewMessage);
        socketInstance.on('typing', onTyping);
        socketInstance.on('onlineCount', onOnlineCount);
        socketInstance.on('userMuted', onUserMuted);
        socketInstance.on('messageDeleted', onMessageDeleted);

        joinRoom(roomType, teamId);

        try {
          const history = roomType === 'global'
            ? await chatApi.getGlobalMessages({ limit: 50 })
            : teamId
              ? await chatApi.getTeamMessages(teamId, { limit: 50 })
              : null;
          const items = (history as { items?: ChatMessage[]; data?: ChatMessage[] })?.items
            ?? (history as { data?: ChatMessage[] })?.data
            ?? (Array.isArray(history) ? history : []);
          if (items.length) setMessages(items as ChatMessage[]);
        } catch {
          // history optional if socket delivers chatHistory
        }

        return () => {
          try {
            leaveRoom(roomType, teamId);
            if (socketInstance) {
              socketInstance.off('connect', onConnect);
              socketInstance.off('disconnect', onDisconnect);
              socketInstance.off('chatHistory', onChatHistory);
              socketInstance.off('newMessage', onNewMessage);
              socketInstance.off('typing', onTyping);
              socketInstance.off('onlineCount', onOnlineCount);
              socketInstance.off('userMuted', onUserMuted);
              socketInstance.off('messageDeleted', onMessageDeleted);
            }
          } catch {
            // cleanup
          }
        };
      } catch {
        // socket not available in SSR or during build
        return () => {};
      }
    };

    let cleanup: (() => void) | undefined;
    setup().then((fn) => { cleanup = fn; });

    return () => {
      if (cleanup) cleanup();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomType, teamId]);

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
      emitTyping(roomType, teamId);
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
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
