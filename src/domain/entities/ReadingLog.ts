import { CalendarDate } from '../value-objects/CalendarDate';

/**
 * Aggregate Root do domínio: o registro de todos os dias em que houve leitura.
 *
 * Encapsula a coleção de dias marcados e garante suas invariantes (sem
 * duplicatas, datas sempre válidas). A UI e a persistência nunca manipulam o
 * `Set` interno diretamente — apenas através destes métodos.
 */
export class ReadingLog {
  private readonly days: Set<string>;

  private constructor(days: Set<string>) {
    this.days = days;
  }

  /** Cria um registro vazio (nenhum dia lido ainda). */
  static empty(): ReadingLog {
    return new ReadingLog(new Set());
  }

  /** Reconstrói o registro a partir de uma lista de datas ISO persistidas. */
  static fromISOList(isoDates: readonly string[]): ReadingLog {
    const days = new Set<string>();
    for (const iso of isoDates) {
      // Passa pelo Value Object para validar/normalizar cada data.
      days.add(CalendarDate.fromISO(iso).toISO());
    }
    return new ReadingLog(days);
  }

  isMarked(date: CalendarDate): boolean {
    return this.days.has(date.toISO());
  }

  mark(date: CalendarDate): void {
    this.days.add(date.toISO());
  }

  unmark(date: CalendarDate): void {
    this.days.delete(date.toISO());
  }

  /**
   * Alterna o estado de um dia. Regra de negócio: não é permitido marcar
   * leitura em datas futuras.
   *
   * @returns `true` se o dia ficou marcado, `false` se foi desmarcado.
   */
  toggle(date: CalendarDate): boolean {
    if (date.isFuture()) {
      throw new Error('Não é possível registrar leitura em uma data futura.');
    }
    if (this.isMarked(date)) {
      this.unmark(date);
      return false;
    }
    this.mark(date);
    return true;
  }

  /** Todas as datas marcadas, em ordem cronológica crescente. */
  markedDates(): CalendarDate[] {
    return this.toISOList().map(CalendarDate.fromISO);
  }

  /** Lista de datas ISO ordenadas — formato usado pela camada de persistência. */
  toISOList(): string[] {
    return Array.from(this.days).sort();
  }

  get total(): number {
    return this.days.size;
  }
}
