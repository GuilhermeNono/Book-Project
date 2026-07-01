import { create } from 'zustand';

import { Profile } from '../../domain/entities/Profile';
import { container } from '../../infrastructure/di/container';

const EMPTY_PROFILE_ERROR = 'Falha ao carregar o perfil.';

interface ProfileState {
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;

  init: () => Promise<void>;
  updateAvatar: (localUri: string) => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
  reset: () => void;
}

/** Store de apresentação para o perfil do usuário (nome + foto). */
export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  loading: false,
  initialized: false,
  error: null,

  init: async () => {
    set({ loading: true });
    try {
      const profile = await container.getProfile.execute();
      set({ profile, loading: false, initialized: true, error: null });
    } catch (err) {
      set({
        loading: false,
        initialized: true,
        error: err instanceof Error ? err.message : EMPTY_PROFILE_ERROR,
      });
    }
  },

  updateAvatar: async (localUri: string) => {
    set({ loading: true });
    try {
      const avatarUrl = await container.updateAvatar.execute(localUri);
      const current = get().profile;
      set({
        profile: current ? { ...current, avatarUrl } : current,
        loading: false,
        error: null,
      });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Falha ao atualizar a foto.',
      });
    }
  },

  updateDisplayName: async (name: string) => {
    set({ loading: true });
    try {
      await container.updateDisplayName.execute(name);
      const current = get().profile;
      set({
        profile: current ? { ...current, displayName: name } : current,
        loading: false,
        error: null,
      });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Falha ao atualizar o nome.',
      });
    }
  },

  reset: () => {
    set({ profile: null, loading: false, initialized: false, error: null });
  },
}));
