import { IFriendshipRepository } from '../../../domain/repositories/IFriendshipRepository';

/** Caso de uso: recusa um convite de amizade pendente. */
export class DeclineFriendRequest {
  constructor(private readonly repository: IFriendshipRepository) {}

  execute(otherUserId: string): Promise<void> {
    return this.repository.decline(otherUserId);
  }
}
