import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string; email: string; name: string; role: string;
  subscription_tier: string; town_id?: string; town_name?: string;
  avatar_url?: string; phone?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setAuth: (user: User, token: string) => void;
  setUser: (user: Partial<User>) => void;
  logout: () => void;
  setLoading: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      setAuth: (user, token) => set({ user, token }),
      setUser: (partial) => set((s) => ({ user: s.user ? { ...s.user, ...partial } : null })),
      logout: () => set({ user: null, token: null }),
      setLoading: (v) => set({ isLoading: v }),
    }),
    {
      name: 'dorpwag-auth',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
