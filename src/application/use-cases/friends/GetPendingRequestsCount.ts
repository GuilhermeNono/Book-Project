import { IFriendshipRepository } from '../../../domain/repositories/IFriendshipRepository';
import { FriendshipHelpers } from '../../../domain/services/FriendshipHelpers';

/** Caso de uso: conta convites pendentes recebidos pelo usuário atual (para o badge da aba). */
export class GetPendingRequestsCount {
  constructor(private readonly repository: IFriendshipRepository) {}

  async execute(currentUserId: string): Promise<number> {
    const friendships = await this.repository.listForCurrentUser();
    return friendships.filter(
      (f) => f.status === 'pending' && !FriendshipHelpers.isRequester(f, currentUserId),
    ).length;
  }
}
