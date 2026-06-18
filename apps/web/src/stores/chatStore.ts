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
  removeMessage: (messageId: string) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  typingUsers: [],
  onlineCount: 0,
  isConnected: false,

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages.slice(-199), message],
    })),

  setMessages: (messages) => set({ messages }),

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

  removeMessage: (messageId) =>
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== messageId),
    })),
}));
