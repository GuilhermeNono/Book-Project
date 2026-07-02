import { create } from 'zustand';

import { FriendListItem } from '../../application/use-cases/friends/GetFriends';
import { container } from '../../infrastructure/di/container';
import { useAuthStore } from './useAuthStore';

interface FriendsState {
  friends: FriendListItem[];
  incomingRequests: FriendListItem[];
  outgoingRequests: FriendListItem[];
  pendingCount: number;
  loading: boolean;
  initialized: boolean;
  error: string | null;

  init: () => Promise<void>;
  sendRequest: (targetUserId: string) => Promise<void>;
  accept: (requesterUserId: string) => Promise<void>;
  decline: (requesterUserId: string) => Promise<void>;
  remove: (otherUserId: string) => Promise<void>;
  fetchPendingCount: () => Promise<void>;
  reset: () => void;
}

function currentUserId(): string {
  const userId = useAuthStore.getState().session?.userId;
  if (!userId) {
    throw new Error('Usuário não autenticado.');
  }
  return userId;
}

/** Store de apresentação para amigos: lista de amigos, pedidos pendentes e ações de convite. */
export const useFriendsStore = create<FriendsState>((set, get) => ({
  friends: [],
  incomingRequests: [],
  outgoingRequests: [],
  pendingCount: 0,
  loading: false,
  initialized: false,
  error: null,

  init: async () => {
    set({ loading: true });
    try {
      const items = await container.getFriends.execute(currentUserId());
      const incomingRequests = items.filter((i) => i.status === 'pending' && !i.requestedByMe);
      set({
        friends: items.filter((i) => i.status === 'accepted'),
        incomingRequests,
        outgoingRequests: items.filter((i) => i.status === 'pending' && i.requestedByMe),
        pendingCount: incomingRequests.length,
        loading: false,
        initialized: true,
        error: null,
      });
    } catch (err) {
      set({
        loading: false,
        initialized: true,
        error: err instanceof Error ? err.message : 'Falha ao carregar amigos.',
      });
    }
  },

  sendRequest: async (targetUserId: string) => {
    try {
      await container.sendFriendRequest.execute(targetUserId, currentUserId());
      await get().init();
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Falha ao enviar convite.' });
    }
  },

  accept: async (requesterUserId: string) => {
    try {
      await container.acceptFriendRequest.execute(requesterUserId, currentUserId());
      await get().init();
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Falha ao aceitar convite.' });
    }
  },

  decline: async (requesterUserId: string) => {
    try {
      await container.declineFriendRequest.execute(requesterUserId);
      await get().init();
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Falha ao recusar convite.' });
    }
  },

  remove: async (otherUserId: string) => {
    try {
      await container.removeFriend.execute(otherUserId);
      await get().init();
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Falha ao desfazer amizade.' });
    }
  },

  fetchPendingCount: async () => {
    try {
      const pendingCount = await container.getPendingRequestsCount.execute(currentUserId());
      set({ pendingCount });
    } catch {
      // Falha silenciosa: contagem de badge não deve travar o boot do app.
    }
  },

  reset: () => {
    set({
      friends: [],
      incomingRequests: [],
      outgoingRequests: [],
      pendingCount: 0,
      loading: false,
      initialized: false,
      error: null,
    });
  },
}));
