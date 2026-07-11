'use client';
import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth.store';
import MessageItem from '@/components/chat/MessageItem';
import MessageInput from '@/components/chat/MessageInput';
import TypingIndicator from '@/components/chat/TypingIndicator';
import { useChat } from '@/hooks/useChat';

interface LiveChatPanelProps {
  roomType?: 'global' | 'team';
  teamId?: string;
  title?: string;
}

export default function LiveChatPanel({
  roomType = 'global',
  teamId,
  title = 'چت زنده',
}: LiveChatPanelProps) {
  const currentUserId = useAuthStore((state) =>
    state.user?.id ? String(state.user.id) : null
  );
  const { messages, typingUsers, onlineCount, isConnected, send, handleTyping } = useChat({
    roomType,
    teamId,
  });
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const previousMessageCountRef = useRef(0);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const messageCount = messages.length;
    const shouldStickToBottom =
      previousMessageCountRef.current === 0 ||
      container.scrollHeight - container.scrollTop - container.clientHeight < 80;

    if (messageCount > previousMessageCountRef.current && shouldStickToBottom) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: previousMessageCountRef.current === 0 ? 'auto' : 'smooth',
      });
    }

    previousMessageCountRef.current = messageCount;
  }, [messages.length]);

  return (
    <div
      className="dark-card rounded-[18px] flex flex-col"
      style={{ height: 500 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`}
          />
          <h3 className="font-cinzel text-sm text-[#00f5ff]">{title}</h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-vazir">
          <i className="fas fa-users text-green-600" />
          <span>{isConnected ? `${onlineCount} آنلاین` : 'در حال اتصال...'}</span>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#00f5ff]/30"
      >
        {messages.length === 0 ? (
          <div className="h-full min-h-40 flex items-center justify-center text-center text-sm font-vazir text-gray-600">
            {isConnected ? 'هنوز پیامی در این اتاق ثبت نشده است' : 'اتصال چت در حال برقراری است'}
          </div>
        ) : (
          messages.map((msg) => (
            <MessageItem
              key={msg.id}
              message={msg}
              isMe={!!currentUserId && msg.userId === currentUserId}
            />
          ))
        )}
        <TypingIndicator typingUsers={typingUsers} />
      </div>

      {/* Input */}
      <div className="p-4">
        <MessageInput
          onSend={send}
          onTyping={handleTyping}
          disabled={!isConnected}
          placeholder={isConnected ? 'پیام خود را بنویسید...' : 'اتصال چت برقرار نیست'}
        />
      </div>
    </div>
  );
}
