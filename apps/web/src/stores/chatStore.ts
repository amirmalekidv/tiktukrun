import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: string;
  roomType: 'global' | 'team';
  teamId?: string;
  isMuted?: boolean;
  isReported?: boolean;
}

export interface TypingUser {
  userId: string;
  userName: string;
}

interface ChatStore {
  messages: ChatMessage[];
  typingUsers: TypingUser[];
  onlineCount: number;
  isConnected: boolean;
  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  setTypingUser: (userId: string, userName: string, isTyping: boolean) => void;
  setOnlineCount: (count: number) => void;
  setConnected: (status: boolean) => void;
  clearMessages: () => void;
  clearTypingUsers: () => void;
  removeMessage: (messageId: string) => void;
  resetRoom: () => void;
}

function normalizeMessages(messages: ChatMessage[]) {
  const unique = new Map<string, ChatMessage>();

  for (const message of messages) {
    unique.set(message.id, message);
  }

  return Array.from(unique.values())
    .sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return aTime - bTime;
    })
    .slice(-200);
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  typingUsers: [],
  onlineCount: 0,
  isConnected: false,

  addMessage: (message) =>
    set((state) => ({
      messages: normalizeMessages([...state.messages, message]),
    })),

  setMessages: (messages) => set({ messages: normalizeMessages(messages) }),

  setTypingUser: (userId, userName, isTyping) =>
    set((state) => {
      if (isTyping) {
        const exists = state.typingUsers.find((u) => u.userId === userId);
        if (exists) return state;
        return { typingUsers: [...state.typingUsers, { userId, userName }] };
      } else {
        return {
          typingUsers: state.typingUsers.filter((u) => u.userId !== userId),
        };
      }
    }),

  setOnlineCount: (count) => set({ onlineCount: count }),
  setConnected: (status) => set({ isConnected: status }),
  clearMessages: () => set({ messages: [] }),
  clearTypingUsers: () => set({ typingUsers: [] }),

  removeMessage: (messageId) =>
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== messageId),
    })),

  resetRoom: () =>
    set({
      messages: [],
      typingUsers: [],
      onlineCount: 0,
    }),
}));
