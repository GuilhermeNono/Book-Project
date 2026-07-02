import { Book } from '../entities/Book';
import { PublicProfile } from '../entities/PublicProfile';

/** Porta do domínio para perfis públicos e vitrines de outros usuários. */
export interface IPublicProfileRepository {
  /** Busca perfis por `display_name` (parcial), excluindo o próprio usuário. */
  search(query: string): Promise<PublicProfile[]>;
  /** Busca vários perfis por id de uma vez (evita N+1 ao resolver a lista de amigos). */
  getManyByIds(userIds: string[]): Promise<PublicProfile[]>;
  /** Vitrine pública de qualquer usuário, por userId. */
  getShowcaseFor(userId: string): Promise<Book[]>;
}
