/**
 * Value Object que representa um dia do calendário (sem horário/timezone).
 *
 * É imutável e sempre normalizado no formato ISO `YYYY-MM-DD`, o que evita
 * bugs clássicos de fuso horário ao comparar "dias" em vez de instantes.
 */
export class CalendarDate {
  private readonly value: string; // YYYY-MM-DD

  private constructor(value: string) {
    this.value = value;
  }

  /** Cria a partir de uma string ISO (`YYYY-MM-DD`), validando o formato. */
  static fromISO(iso: string): CalendarDate {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
      throw new Error(`Data inválida: "${iso}". Formato esperado: YYYY-MM-DD.`);
    }
    return new CalendarDate(iso);
  }

  /** Cria a partir de um `Date`, usando os componentes locais (dia civil). */
  static fromDate(date: Date): CalendarDate {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return new CalendarDate(`${year}-${month}-${day}`);
  }

  /** O dia de hoje segundo o relógio local do dispositivo. */
  static today(): CalendarDate {
    return CalendarDate.fromDate(new Date());
  }

  toISO(): string {
    return this.value;
  }

  /** Converte para `Date` ancorado ao meio-dia local (evita saltos de fuso). */
  toDate(): Date {
    const [year, month, day] = this.value.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0, 0);
  }

  get year(): number {
    return Number(this.value.slice(0, 4));
  }

  /** Mês no padrão humano: 1 = Janeiro ... 12 = Dezembro. */
  get month(): number {
    return Number(this.value.slice(5, 7));
  }

  get day(): number {
    return Number(this.value.slice(8, 10));
  }

  equals(other: CalendarDate): boolean {
    return this.value === other.value;
  }

  /** Retorna uma nova data deslocada em `days` (pode ser negativo). */
  addDays(days: number): CalendarDate {
    const date = this.toDate();
    date.setDate(date.getDate() + days);
    return CalendarDate.fromDate(date);
  }

  previousDay(): CalendarDate {
    return this.addDays(-1);
  }

  isToday(): boolean {
    return this.equals(CalendarDate.today());
  }

  /** Verdadeiro se esta data pertence ao mesmo mês/ano de `other`. */
  isSameMonth(other: CalendarDate): boolean {
    return this.year === other.year && this.month === other.month;
  }

  /** Verdadeiro se a data está no futuro em relação a hoje. */
  isFuture(): boolean {
    return this.value > CalendarDate.today().toISO();
  }
}
