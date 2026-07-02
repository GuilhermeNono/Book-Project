import { Message } from '../../../domain/entities/Message';
import { IMessageRepository } from '../../../domain/repositories/IMessageRepository';

/** Caso de uso: envia uma mensagem de texto para um amigo. */
export class SendMessage {
  constructor(private readonly repository: IMessageRepository) {}

  execute(recipientId: string, body: string): Promise<Message> {
    const trimmed = body.trim();
    if (!trimmed) {
      throw new Error('A mensagem não pode estar vazia.');
    }
    return this.repository.send(recipientId, trimmed);
  }
}
