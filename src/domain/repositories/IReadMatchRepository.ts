import { ReadingLog } from '../entities/ReadingLog';

/**
 * Porta do domínio para leitura (somente leitura) do registro de leituras
 * usado pelo Read Match. Separada de `IReadingRepository` — aquela é
 * diff-based e acoplada ao fluxo de `save()` da HomeScreen; esta é só
 * leitura, recortada por data e capaz de ler o registro de outro usuário.
 */
export interface IReadMatchRepository {
  /** ReadingLog do usuário atual, a partir de `sinceISO` (inclusive). */
  loadOwnSince(sinceISO: string): Promise<ReadingLog>;
  /** ReadingLog de um amigo aceito, a partir de `sinceISO` — só retorna dados se houver amizade aceita (RLS). */
  loadFriendSince(otherUserId: string, sinceISO: string): Promise<ReadingLog>;
}
