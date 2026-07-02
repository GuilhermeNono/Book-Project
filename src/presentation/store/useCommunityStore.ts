import { create } from 'zustand';

import { Book } from '../../domain/entities/Book';
import { PublicProfile } from '../../domain/entities/PublicProfile';
import { container } from '../../infrastructure/di/container';

interface CommunityState {
  results: PublicProfile[];
  searching: boolean;
  viewingShowcaseOf: PublicProfile | null;
  viewingShowcaseBooks: Book[];
  loadingShowcase: boolean;
  error: string | null;

  search: (query: string) => Promise<void>;
  clearSearch: () => void;
  openPublicShowcase: (profile: PublicProfile) => Promise<void>;
  closePublicShowcase: () => void;
  reset: () => void;
}

/** Store de apresentação para busca de usuários e visualização de vitrines públicas. */
export const useCommunityStore = create<CommunityState>((set) => ({
  results: [],
  searching: false,
  viewingShowcaseOf: null,
  viewingShowcaseBooks: [],
  loadingShowcase: false,
  error: null,

  search: async (query: string) => {
    set({ searching: true });
    try {
      const results = await container.searchUsers.execute(query);
      set({ results, searching: false, error: null });
    } catch (err) {
      set({
        searching: false,
        error: err instanceof Error ? err.message : 'Falha ao buscar usuários.',
      });
    }
  },

  clearSearch: () => set({ results: [] }),

  openPublicShowcase: async (profile: PublicProfile) => {
    set({ viewingShowcaseOf: profile, viewingShowcaseBooks: [], loadingShowcase: true });
    try {
      const viewingShowcaseBooks = await container.getPublicShowcase.execute(profile.userId);
      set({ viewingShowcaseBooks, loadingShowcase: false });
    } catch (err) {
      set({
        loadingShowcase: false,
        error: err instanceof Error ? err.message : 'Falha ao carregar a vitrine.',
      });
    }
  },

  closePublicShowcase: () => set({ viewingShowcaseOf: null, viewingShowcaseBooks: [] }),

  reset: () => {
    set({
      results: [],
      searching: false,
      viewingShowcaseOf: null,
      viewingShowcaseBooks: [],
      loadingShowcase: false,
      error: null,
    });
  },
}));
