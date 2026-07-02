import { Friendship } from '../entities/Friendship';

/**
 * Funções puras auxiliares sobre `Friendship`. Não é um aggregate root (não
 * há invariante além de "qual lado é qual"), por isso fica como um conjunto
 * de helpers estáticos, no mesmo espírito de `VersionComparator`.
 */
export class FriendshipHelpers {
  /** Ordena um par de userIds no formato usado como chave primária da tabela. */
  static sortedPair(a: string, b: string): { userLow: string; userHigh: string } {
    return a < b ? { userLow: a, userHigh: b } : { userLow: b, userHigh: a };
  }

  /** Retorna o outro participante da amizade, dado o próprio userId. */
  static otherUser(friendship: Friendship, selfUserId: string): string {
    if (friendship.userLow === selfUserId) {
      return friendship.userHigh;
    }
    if (friendship.userHigh === selfUserId) {
      return friendship.userLow;
    }
    throw new Error('Usuário não participa desta amizade.');
  }

  /** Verdadeiro se `userId` foi quem enviou o convite original. */
  static isRequester(friendship: Friendship, userId: string): boolean {
    return friendship.requestedBy === userId;
  }
}
