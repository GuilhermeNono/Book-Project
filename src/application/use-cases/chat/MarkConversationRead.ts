import { IMessageRepository } from '../../../domain/repositories/IMessageRepository';

/** Caso de uso: marca como lidas todas as mensagens recebidas de um amigo. */
export class MarkConversationRead {
  constructor(private readonly repository: IMessageRepository) {}

  execute(otherUserId: string): Promise<void> {
    return this.repository.markConversationRead(otherUserId);
  }
}
