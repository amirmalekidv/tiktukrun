'use client';
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import MessageItem from '@/components/chat/MessageItem';
import MessageInput from '@/components/chat/MessageInput';
import TypingIndicator from '@/components/chat/TypingIndicator';
import { useChat } from '@/hooks/useChat';

interface LiveChatPanelProps {
  roomType?: 'global' | 'team';
  teamId?: string;
  title?: string;
}

// Demo messages for when socket is not connected
const DEMO_MESSAGES = [
  { id: '1', userId: 'u1', userName: 'Shadow Reaper', text: 'سلام به همه! آماده‌اید؟', createdAt: new Date(Date.now() - 300000).toISOString(), roomType: 'global' as const },
  { id: '2', userId: 'u2', userName: 'Night Walker', text: 'بله! اتاق ترس امشب فوق‌العاده بود 😱', createdAt: new Date(Date.now() - 240000).toISOString(), roomType: 'global' as const },
  { id: '3', userId: 'u3', userName: 'Void Dancer', text: 'کی میاد تیم تشکیل بده؟', createdAt: new Date(Date.now() - 180000).toISOString(), roomType: 'global' as const },
  { id: '4', userId: 'u1', userName: 'Shadow Reaper', text: 'منم! ۶ نفر می‌خوایم برای اتاق فرار', createdAt: new Date(Date.now() - 120000).toISOString(), roomType: 'global' as const },
  { id: '5', userId: 'u4', userName: 'Blood Hunter', text: 'این هفته رتبه سوم شدم 🎉', createdAt: new Date(Date.now() - 60000).toISOString(), roomType: 'global' as const },
];

export default function LiveChatPanel({
  roomType = 'global',
  teamId,
  title = 'چت زنده',
}: LiveChatPanelProps) {
  const { messages, typingUsers, onlineCount, isConnected, send, handleTyping } = useChat({
    roomType,
    teamId,
  });
  const bottomRef = useRef<HTMLDivElement>(null);

  const displayMessages = messages.length > 0 ? messages : DEMO_MESSAGES;

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMessages]);

  return (
    <div
      className="dark-card rounded-2xl border border-red-900/30 bg-[#0d0d0d] flex flex-col"
      style={{ height: 500 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800/50">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`}
          />
          <h3 className="font-cinzel text-sm text-red-400">{title}</h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-vazir">
          <i className="fas fa-users text-green-600" />
          <span>{onlineCount || 18} آنلاین</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-red-900/30">
        {displayMessages.map((msg) => (
          <MessageItem
            key={msg.id}
            message={msg as any}
            isMe={msg.userId === 'me'}
          />
        ))}
        <TypingIndicator typingUsers={typingUsers} />
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4">
        <MessageInput
          onSend={send}
          onTyping={handleTyping}
          disabled={!isConnected && messages.length === 0}
          placeholder={isConnected ? 'پیام خود را بنویسید...' : 'در حال اتصال...'}
        />
      </div>
    </div>
  );
}
