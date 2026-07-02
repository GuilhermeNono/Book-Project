import { create } from 'zustand';

import { Message } from '../../domain/entities/Message';
import { container } from '../../infrastructure/di/container';

interface ChatState {
  activeConversationWith: string | null;
  messages: Message[];
  sending: boolean;
  loading: boolean;
  error: string | null;

  openConversation: (otherUserId: string) => Promise<void>;
  closeConversation: () => void;
  send: (body: string) => Promise<void>;
  reset: () => void;
}

// Guardado fora do estado do Zustand: é só um handle de controle (não algo
// que a UI deva ler/re-renderizar em cima), igual ao unsubscribe interno de
// `IAuthRepository.onSessionChange`.
let unsubscribe: (() => void) | null = null;

function closeChannel() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}

/** Store de apresentação para o chat de texto entre amigos (histórico + Supabase Realtime). */
export const useChatStore = create<ChatState>((set, get) => ({
  activeConversationWith: null,
  messages: [],
  sending: false,
  loading: false,
  error: null,

  openConversation: async (otherUserId: string) => {
    closeChannel();
    set({ activeConversationWith: otherUserId, messages: [], loading: true, error: null });
    try {
      const messages = await container.getConversation.execute(otherUserId);
      await container.markConversationRead.execute(otherUserId);
      set({ messages, loading: false });
      unsubscribe = container.messageRepository.subscribeToConversation(otherUserId, (message) => {
        set({ messages: [...get().messages, message] });
      });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Falha ao carregar a conversa.',
      });
    }
  },

  closeConversation: () => {
    closeChannel();
    set({ activeConversationWith: null, messages: [], loading: false, error: null });
  },

  send: async (body: string) => {
    const otherUserId = get().activeConversationWith;
    if (!otherUserId) {
      return;
    }
    set({ sending: true });
    try {
      const message = await container.sendMessage.execute(otherUserId, body);
      set({ messages: [...get().messages, message], sending: false });
    } catch (err) {
      set({
        sending: false,
        error: err instanceof Error ? err.message : 'Falha ao enviar mensagem.',
      });
    }
  },

  reset: () => {
    closeChannel();
    set({ activeConversationWith: null, messages: [], sending: false, loading: false, error: null });
  },
}));
