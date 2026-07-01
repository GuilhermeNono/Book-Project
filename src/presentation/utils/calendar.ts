import { CalendarDate } from '../../domain/value-objects/CalendarDate';

export const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'] as const;

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const;

export function monthLabel(year: number, month: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

/**
 * Monta a grade de um mês como uma lista de células. Posições anteriores ao
 * primeiro dia (para alinhar a semana) vêm como `null`.
 */
export function buildMonthGrid(
  year: number,
  month: number,
): Array<CalendarDate | null> {
  const firstOfMonth = new Date(year, month - 1, 1);
  const leadingBlanks = firstOfMonth.getDay(); // 0 = domingo
  const daysInMonth = new Date(year, month, 0).getDate();

  const cells: Array<CalendarDate | null> = [];
  for (let i = 0; i < leadingBlanks; i += 1) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(CalendarDate.fromDate(new Date(year, month - 1, day)));
  }
  return cells;
}

/** Avança/retrocede um mês, tratando a virada de ano. */
export function shiftMonth(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const zeroBased = month - 1 + delta;
  const newYear = year + Math.floor(zeroBased / 12);
  const newMonth = ((zeroBased % 12) + 12) % 12;
  return { year: newYear, month: newMonth + 1 };
}
