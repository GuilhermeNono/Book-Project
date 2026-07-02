import { Message } from '../../../domain/entities/Message';
import { IMessageRepository } from '../../../domain/repositories/IMessageRepository';

/** Caso de uso: recupera o histórico de mensagens trocadas com um amigo. */
export class GetConversation {
  constructor(private readonly repository: IMessageRepository) {}

  execute(otherUserId: string): Promise<Message[]> {
    return this.repository.listConversation(otherUserId);
  }
}
