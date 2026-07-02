import { Friendship } from '../../../domain/entities/Friendship';
import { IFriendshipRepository } from '../../../domain/repositories/IFriendshipRepository';
import { FriendshipHelpers } from '../../../domain/services/FriendshipHelpers';

/** Caso de uso: aceita um convite de amizade pendente recebido de `requesterUserId`. */
export class AcceptFriendRequest {
  constructor(private readonly repository: IFriendshipRepository) {}

  async execute(requesterUserId: string, currentUserId: string): Promise<Friendship> {
    const friendships = await this.repository.listForCurrentUser();
    const target = friendships.find(
      (f) => FriendshipHelpers.otherUser(f, currentUserId) === requesterUserId,
    );

    if (!target || target.status !== 'pending') {
      throw new Error('Não há convite pendente deste usuário.');
    }
    if (FriendshipHelpers.isRequester(target, currentUserId)) {
      throw new Error('Você não pode aceitar seu próprio convite.');
    }

    return this.repository.accept(requesterUserId);
  }
}
