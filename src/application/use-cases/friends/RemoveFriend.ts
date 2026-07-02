import { IFriendshipRepository } from '../../../domain/repositories/IFriendshipRepository';

/** Caso de uso: desfaz uma amizade já aceita. */
export class RemoveFriend {
  constructor(private readonly repository: IFriendshipRepository) {}

  execute(otherUserId: string): Promise<void> {
    return this.repository.unfriend(otherUserId);
  }
}
