import { ReadingLog } from '../../domain/entities/ReadingLog';
import { IReadingRepository } from '../../domain/repositories/IReadingRepository';

/**
 * Caso de uso: recuperar o registro de leituras persistido.
 * Usado na inicialização do app para hidratar a UI.
 */
export class GetReadingLog {
  constructor(private readonly repository: IReadingRepository) {}

  execute(): Promise<ReadingLog> {
    return this.repository.load();
  }
}
