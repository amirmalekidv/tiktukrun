'use client';
import { useState, useRef, KeyboardEvent } from 'react';

interface MessageInputProps {
  onSend: (text: string) => void;
  onTyping?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function MessageInput({
  onSend,
  onTyping,
  disabled,
  placeholder = 'پیام خود را بنویسید...',
}: MessageInputProps) {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    onTyping?.();
  };

  return (
    <div className="flex gap-2 items-end pt-3 border-t border-gray-800/50">
      <textarea
        ref={inputRef}
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        rows={2}
        placeholder={placeholder}
        className="
          flex-1 bg-gray-900/60 border border-gray-800/50 rounded-xl px-4 py-3
          text-gray-200 font-vazir text-sm resize-none focus:outline-none
          focus:border-red-700/60 transition-colors placeholder-gray-600
          min-h-[52px] max-h-28 leading-relaxed
        "
      />
      <button
        onClick={handleSend}
        disabled={disabled || !text.trim()}
        className="
          w-11 h-11 rounded-xl bg-red-800/60 hover:bg-red-700/80 border border-red-700/40
          flex items-center justify-center transition-all flex-shrink-0
          disabled:opacity-30 disabled:cursor-not-allowed
          text-red-300 hover:text-red-200
        "
        aria-label="ارسال"
      >
        {/* Paper-plane icon mirrored for RTL */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-4 h-4"
          style={{ transform: 'rotate(180deg)' }}
        >
          <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
        </svg>
      </button>
    </div>
  );
}
