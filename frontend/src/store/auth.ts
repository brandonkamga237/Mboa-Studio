import { create } from 'zustand';
import { getMe } from '../api/client';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  setToken: (token: string) => void;
  loadMe: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('mc_token'),
  loading: false,

  setToken: (token) => {
    localStorage.setItem('mc_token', token);
    set({ token });
  },

  loadMe: async () => {
    set({ loading: true });
    try {
      const user = await getMe();
      set({ user, loading: false });
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401 || status === 403) {
        // Token invalide côté serveur — déconnexion forcée
        localStorage.removeItem('mc_token');
        set({ user: null, token: null, loading: false });
      } else {
        // Erreur réseau ou serveur temporaire — conserver le token
        set({ loading: false });
      }
    }
  },

  logout: () => {
    localStorage.removeItem('mc_token');
    set({ user: null, token: null });
  },
}));
