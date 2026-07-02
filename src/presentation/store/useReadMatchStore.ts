import { create } from 'zustand';

import { PublicProfile } from '../../domain/entities/PublicProfile';
import { ReadMatch } from '../../domain/services/ReadMatch';
import { container } from '../../infrastructure/di/container';

interface ReadMatchState {
  result: ReadMatch | null;
  comparingWith: PublicProfile | null;
  loading: boolean;
  error: string | null;

  compare: (friend: PublicProfile, currentUserId: string) => Promise<void>;
  clear: () => void;
  reset: () => void;
}

/** Store de apresentação para o "Read Match": comparação de leitura com um amigo. */
export const useReadMatchStore = create<ReadMatchState>((set) => ({
  result: null,
  comparingWith: null,
  loading: false,
  error: null,

  compare: async (friend: PublicProfile, currentUserId: string) => {
    set({ comparingWith: friend, result: null, loading: true, error: null });
    try {
      const result = await container.compareReadingActivity.execute(friend.userId, currentUserId);
      set({ result, loading: false });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Falha ao comparar leituras.',
      });
    }
  },

  clear: () => set({ result: null, comparingWith: null, error: null }),

  reset: () => set({ result: null, comparingWith: null, loading: false, error: null }),
}));
