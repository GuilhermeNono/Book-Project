import { ReadingEntry, ReadingLog } from '../../domain/entities/ReadingLog';
import { IReadingRepository } from '../../domain/repositories/IReadingRepository';
import { CalendarDate } from '../../domain/value-objects/CalendarDate';

/**
 * Caso de uso central do app: alternar o registro de leitura de um dia.
 *
 * Orquestra o fluxo (carregar → aplicar regra de domínio → persistir) sem
 * conhecer os detalhes de armazenamento nem de UI.
 */
export class ToggleReadingDay {
  constructor(private readonly repository: IReadingRepository) {}

  /**
   * @param date Dia a alternar. Por padrão, hoje.
   * @param entry Livro lido nesse dia (opcional; ignorado ao desmarcar).
   * @returns O `ReadingLog` atualizado, já persistido.
   */
  async execute(
    date: CalendarDate = CalendarDate.today(),
    entry?: ReadingEntry,
  ): Promise<ReadingLog> {
    const log = await this.repository.load();
    log.toggle(date, entry); // regra de negócio vive no aggregate
    await this.repository.save(log);
    return log;
  }
}
