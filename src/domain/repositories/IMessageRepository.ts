import { Message } from '../entities/Message';

/** Porta do domínio para o chat de texto entre amigos. */
export interface IMessageRepository {
  /** Histórico de mensagens trocadas com `otherUserId`, ordenado por data crescente. */
  listConversation(otherUserId: string): Promise<Message[]>;
  send(recipientId: string, body: string): Promise<Message>;
  /** Marca como lidas todas as mensagens recebidas de `otherUserId`. */
  markConversationRead(otherUserId: string): Promise<void>;
  /**
   * Assina novas mensagens em tempo real na conversa com `otherUserId`.
   * Retorna uma função de unsubscribe (mesmo formato de `IAuthRepository.onSessionChange`).
   */
  subscribeToConversation(otherUserId: string, onMessage: (message: Message) => void): () => void;
}
