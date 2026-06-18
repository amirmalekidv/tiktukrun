'use client';
import { useChatStore } from '@/stores/chatStore';

export default function OnlineUsersIndicator() {
  const { onlineCount, isConnected } = useChatStore();

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
      <span className="text-xs text-gray-500 font-vazir">
        {onlineCount || 18} نفر آنلاین
      </span>
    </div>
  );
}
