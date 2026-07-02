import { IFriendshipRepository } from '../../../domain/repositories/IFriendshipRepository';
import { IPublicProfileRepository } from '../../../domain/repositories/IPublicProfileRepository';
import { IReadMatchRepository } from '../../../domain/repositories/IReadMatchRepository';
import { IShowcaseRepository } from '../../../domain/repositories/IShowcaseRepository';
import { FriendshipHelpers } from '../../../domain/services/FriendshipHelpers';
import { ReadMatch } from '../../../domain/services/ReadMatch';
import { ReadMatchCalculator } from '../../../domain/services/ReadMatchCalculator';

/**
 * Caso de uso: compara a atividade de leitura dos últimos 3 meses entre o
 * usuário atual e um amigo. Só funciona entre amigos com convite aceito —
 * confere isso explicitamente antes de consultar (a RLS bloquearia de
 * qualquer forma, mas silenciosamente com uma lista vazia, o que daria uma
 * mensagem de erro confusa em vez de clara).
 */
export class CompareReadingActivity {
  constructor(
    private readonly readMatchRepository: IReadMatchRepository,
    private readonly friendshipRepository: IFriendshipRepository,
    private readonly showcaseRepository: IShowcaseRepository,
    private readonly publicProfileRepository: IPublicProfileRepository,
  ) {}

  async execute(friendUserId: string, currentUserId: string): Promise<ReadMatch> {
    const friendships = await this.friendshipRepository.listForCurrentUser();
    const friendship = friendships.find(
      (f) => FriendshipHelpers.otherUser(f, currentUserId) === friendUserId,
    );
    if (!friendship || friendship.status !== 'accepted') {
      throw new Error('Read Match está disponível apenas entre amigos.');
    }

    const since = ReadMatchCalculator.windowStart().toISO();

    const [selfLog, friendLog, selfShowcase, friendShowcase] = await Promise.all([
      this.readMatchRepository.loadOwnSince(since),
      this.readMatchRepository.loadFriendSince(friendUserId, since),
      this.showcaseRepository.load(),
      this.publicProfileRepository.getShowcaseFor(friendUserId),
    ]);

    return ReadMatchCalculator.compute(selfLog, friendLog, selfShowcase, friendShowcase);
  }
}
