import { create } from 'zustand';

import { Session } from '../../domain/entities/Session';
import { container } from '../../infrastructure/di/container';
import { useChatStore } from './useChatStore';
import { useCommunityStore } from './useCommunityStore';
import { useFriendsStore } from './useFriendsStore';
import { useProfileStore } from './useProfileStore';
import { useReadMatchStore } from './useReadMatchStore';
import { useReadingStore } from './useReadingStore';
import { useShowcaseStore } from './useShowcaseStore';

interface AuthState {
  session: Session | null;
  /** `false` até a sessão inicial ter sido resolvida (evita "flash" de login). */
  initialized: boolean;
  loading: boolean;
  error: string | null;

  init: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

/**
 * Store de apresentação para autenticação. Assina mudanças de sessão do
 * Supabase (login/logout/refresh de token) e expõe um estado simples para a UI.
 */
export const useAuthStore = create<AuthState>((set, get) => {
  container.authRepository.onSessionChange((session) => {
    const previousUserId = get().session?.userId;
    if (previousUserId && previousUserId !== session?.userId) {
      // Trocou de usuário (ou saiu): limpa dados do usuário anterior.
      useReadingStore.getState().reset();
      useShowcaseStore.getState().reset();
      useProfileStore.getState().reset();
      useFriendsStore.getState().reset();
      useChatStore.getState().reset();
      useCommunityStore.getState().reset();
      useReadMatchStore.getState().reset();
    }
    set({ session });
  });

  return {
    session: null,
    initialized: false,
    loading: false,
    error: null,

    init: async () => {
      try {
        const session = await container.authRepository.getSession();
        set({ session, initialized: true });
      } catch {
        set({ session: null, initialized: true });
      }
    },

    signIn: async (email: string, password: string) => {
      set({ loading: true, error: null });
      try {
        const session = await container.signIn.execute(email, password);
        set({ session, loading: false });
      } catch (err) {
        set({
          loading: false,
          error: err instanceof Error ? err.message : 'Falha ao entrar.',
        });
      }
    },

    signUp: async (email: string, password: string) => {
      set({ loading: true, error: null });
      try {
        const session = await container.signUp.execute(email, password);
        set({ session, loading: false });
      } catch (err) {
        set({
          loading: false,
          error: err instanceof Error ? err.message : 'Falha ao criar conta.',
        });
      }
    },

    signOut: async () => {
      set({ loading: true });
      await container.signOut.execute();
      set({ session: null, loading: false });
    },

    clearError: () => set({ error: null }),
  };
});
