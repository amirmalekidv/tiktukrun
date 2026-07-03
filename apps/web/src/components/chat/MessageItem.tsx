'use client';
import { useState } from 'react';
import Image from 'next/image';
import type { ChatMessage } from '@/stores/chatStore';
import ReportModal from './ReportModal';

interface MessageItemProps {
  message: ChatMessage;
  isMe?: boolean;
}

export default function MessageItem({ message, isMe }: MessageItemProps) {
  const [showReport, setShowReport] = useState(false);

  const dateObj = new Date(message.createdAt);
  const timeStr = isNaN(dateObj.getTime())
    ? ''
    : dateObj.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div
      className={`flex gap-2.5 group ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-700 flex-shrink-0 mt-0.5">
        {message.userAvatar ? (
          <Image
            src={message.userAvatar}
            alt={message.userName}
            width={32}
            height={32}
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full bg-red-950 flex items-center justify-center">
            <i className="fas fa-skull text-red-400 text-xs" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
        <div className={`flex items-center gap-2 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
          <span className="text-xs text-red-400 font-vazir">{message.userName}</span>
          <span className="text-[10px] text-gray-600">{timeStr}</span>
        </div>

        <div
          className={`
            px-3 py-2 rounded-xl text-sm font-vazir leading-relaxed break-words
            ${isMe
              ? 'bg-red-900/30 border border-red-800/30 text-gray-200 rounded-tl-sm'
              : 'bg-gray-900/60 border border-gray-800/40 text-gray-300 rounded-tr-sm'
            }
          `}
        >
          {message.text}
        </div>

        {/* Report button (only for others) */}
        {!isMe && (
          <button
            type="button"
            onClick={() => setShowReport(true)}
            className="text-[10px] text-gray-700 hover:text-red-600 transition-colors mt-1 opacity-0 group-hover:opacity-100"
          >
            <i className="fas fa-flag" /> گزارش
          </button>
        )}
      </div>

      <ReportModal
        messageId={message.id}
        isOpen={showReport}
        onClose={() => setShowReport(false)}
      />
    </div>
  );
}
