import { FriendshipStatus } from '../../../domain/entities/Friendship';
import { IFriendshipRepository } from '../../../domain/repositories/IFriendshipRepository';
import { IPublicProfileRepository } from '../../../domain/repositories/IPublicProfileRepository';
import { FriendshipHelpers } from '../../../domain/services/FriendshipHelpers';

/** Amizade já combinada com o perfil público do outro participante, pronta para a UI. */
export interface FriendListItem {
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  status: FriendshipStatus;
  requestedByMe: boolean;
}

/** Caso de uso: lista amizades (pendentes e aceitas) do usuário atual, já com perfis resolvidos. */
export class GetFriends {
  constructor(
    private readonly friendshipRepository: IFriendshipRepository,
    private readonly publicProfileRepository: IPublicProfileRepository,
  ) {}

  async execute(currentUserId: string): Promise<FriendListItem[]> {
    const friendships = await this.friendshipRepository.listForCurrentUser();
    if (friendships.length === 0) {
      return [];
    }

    const otherIds = friendships.map((f) => FriendshipHelpers.otherUser(f, currentUserId));
    const profiles = await this.publicProfileRepository.getManyByIds(otherIds);
    const profileById = new Map(profiles.map((profile) => [profile.userId, profile]));

    return friendships.map((friendship) => {
      const otherId = FriendshipHelpers.otherUser(friendship, currentUserId);
      const profile = profileById.get(otherId);
      return {
        userId: otherId,
        displayName: profile?.displayName ?? null,
        avatarUrl: profile?.avatarUrl ?? null,
        status: friendship.status,
        requestedByMe: FriendshipHelpers.isRequester(friendship, currentUserId),
      };
    });
  }
}
