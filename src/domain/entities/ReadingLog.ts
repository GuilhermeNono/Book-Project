import { CalendarDate } from '../value-objects/CalendarDate';

/** Metadados opcionais associados a um dia lido: qual livro da vitrine foi lido. */
export interface ReadingEntry {
  bookId: string | null;
  bookTitle: string | null;
}

const NO_BOOK: ReadingEntry = { bookId: null, bookTitle: null };

/**
 * Aggregate Root do domínio: o registro de todos os dias em que houve leitura.
 *
 * Encapsula a coleção de dias marcados e garante suas invariantes (sem
 * duplicatas, datas sempre válidas). A UI e a persistência nunca manipulam o
 * `Map` interno diretamente — apenas através destes métodos.
 */
export class ReadingLog {
  private readonly days: Map<string, ReadingEntry>;

  private constructor(days: Map<string, ReadingEntry>) {
    this.days = days;
  }

  /** Cria um registro vazio (nenhum dia lido ainda). */
  static empty(): ReadingLog {
    return new ReadingLog(new Map());
  }

  /** Reconstrói o registro a partir de entradas persistidas. */
  static fromEntries(
    entries: readonly { iso: string; bookId: string | null; bookTitle: string | null }[],
  ): ReadingLog {
    const days = new Map<string, ReadingEntry>();
    for (const entry of entries) {
      const iso = CalendarDate.fromISO(entry.iso).toISO();
      days.set(iso, { bookId: entry.bookId, bookTitle: entry.bookTitle });
    }
    return new ReadingLog(days);
  }

  /** Reconstrói o registro a partir de uma lista de datas ISO persistidas (sem livro). */
  static fromISOList(isoDates: readonly string[]): ReadingLog {
    return ReadingLog.fromEntries(
      isoDates.map((iso) => ({ iso, bookId: null, bookTitle: null })),
    );
  }

  isMarked(date: CalendarDate): boolean {
    return this.days.has(date.toISO());
  }

  /** Metadados (livro) do dia, se houver. */
  entryFor(date: CalendarDate): ReadingEntry | undefined {
    return this.days.get(date.toISO());
  }

  mark(date: CalendarDate, entry: ReadingEntry = NO_BOOK): void {
    this.days.set(date.toISO(), entry);
  }

  unmark(date: CalendarDate): void {
    this.days.delete(date.toISO());
  }

  /**
   * Alterna o estado de um dia. Regra de negócio: não é permitido marcar
   * leitura em datas futuras.
   *
   * @param entry Livro associado à leitura (opcional). Ignorado ao desmarcar.
   * @returns `true` se o dia ficou marcado, `false` se foi desmarcado.
   */
  toggle(date: CalendarDate, entry: ReadingEntry = NO_BOOK): boolean {
    if (date.isFuture()) {
      throw new Error('Não é possível registrar leitura em uma data futura.');
    }
    if (this.isMarked(date)) {
      this.unmark(date);
      return false;
    }
    this.mark(date, entry);
    return true;
  }

  /** Todas as datas marcadas, em ordem cronológica crescente. */
  markedDates(): CalendarDate[] {
    return this.toISOList().map(CalendarDate.fromISO);
  }

  /** Lista de datas ISO ordenadas — formato usado pela camada de persistência. */
  toISOList(): string[] {
    return Array.from(this.days.keys()).sort();
  }

  /** Entradas completas (data + livro), ordenadas — formato usado pela persistência. */
  toEntryList(): { iso: string; bookId: string | null; bookTitle: string | null }[] {
    return this.toISOList().map((iso) => ({ iso, ...(this.days.get(iso) ?? NO_BOOK) }));
  }

  get total(): number {
    return this.days.size;
  }
}
