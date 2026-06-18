import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setUser: (user) => set({ user }),
      setToken: (token) => {
        if (token) localStorage.setItem('admin_token', token);
        else localStorage.removeItem('admin_token');
        set({ token });
      },
      logout: () => {
        localStorage.removeItem('admin_token');
        set({ user: null, token: null });
      },
    }),
    {
      name: 'tiktakrun-admin-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);
