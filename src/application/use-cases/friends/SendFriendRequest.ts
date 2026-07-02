import { Friendship } from '../../../domain/entities/Friendship';
import { IFriendshipRepository } from '../../../domain/repositories/IFriendshipRepository';

/** Caso de uso: envia um convite de amizade para outro usuário. */
export class SendFriendRequest {
  constructor(private readonly repository: IFriendshipRepository) {}

  execute(targetUserId: string, currentUserId: string): Promise<Friendship> {
    if (targetUserId === currentUserId) {
      throw new Error('Você não pode adicionar a si mesmo como amigo.');
    }
    return this.repository.sendRequest(targetUserId);
  }
}
