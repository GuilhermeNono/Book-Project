import { ReadingLog } from '../entities/ReadingLog';

/**
 * Porta (Port) do domínio para persistência do registro de leituras.
 *
 * O domínio define o contrato; a infraestrutura fornece a implementação
 * concreta (AsyncStorage, SQLite, API remota...). Isso mantém as regras de
 * negócio independentes de detalhes de armazenamento (Dependency Inversion).
 */
export interface IReadingRepository {
  /** Carrega o registro persistido (ou um registro vazio se não houver dados). */
  load(): Promise<ReadingLog>;

  /** Persiste o estado atual do registro. */
  save(log: ReadingLog): Promise<void>;
}
