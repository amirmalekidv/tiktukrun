'use client';
import { AnimatePresence, motion } from 'framer-motion';
import type { TypingUser } from '@/stores/chatStore';

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
}

export default function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  if (!typingUsers.length) return null;

  const text =
    typingUsers.length === 1
      ? `${typingUsers[0].userName} در حال نوشتن...`
      : `${typingUsers.length} نفر در حال نوشتن...`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 5 }}
        className="flex items-center gap-2 px-3 py-1"
      >
        <div className="flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-red-600"
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
            />
          ))}
        </div>
        <span className="text-xs text-gray-600 font-vazir">{text}</span>
      </motion.div>
    </AnimatePresence>
  );
}
