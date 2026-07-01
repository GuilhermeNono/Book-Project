import { ReadingLog } from '../entities/ReadingLog';
import { CalendarDate } from '../value-objects/CalendarDate';
import { ReadingStats } from './ReadingStats';

/**
 * Domain Service: calcula estatísticas (sequências, totais) a partir de um
 * `ReadingLog`. É uma lógica de negócio pura — sem estado e sem I/O — por isso
 * expõe apenas funções estáticas.
 */
export class ReadingStatsCalculator {
  /**
   * Sequência atual de dias consecutivos. Conta a partir de hoje; se hoje ainda
   * não foi marcado, a sequência é medida a partir de ontem (o dia continua
   * "vivo" até o fim de hoje).
   */
  static currentStreak(
    log: ReadingLog,
    today: CalendarDate = CalendarDate.today(),
  ): number {
    let cursor = log.isMarked(today) ? today : today.previousDay();
    let streak = 0;
    while (log.isMarked(cursor)) {
      streak += 1;
      cursor = cursor.previousDay();
    }
    return streak;
  }

  /** Maior sequência de dias consecutivos em todo o histórico. */
  static longestStreak(log: ReadingLog): number {
    const dates = log.markedDates();
    if (dates.length === 0) {
      return 0;
    }

    let longest = 1;
    let run = 1;
    for (let i = 1; i < dates.length; i += 1) {
      const isConsecutive = dates[i - 1].addDays(1).equals(dates[i]);
      run = isConsecutive ? run + 1 : 1;
      longest = Math.max(longest, run);
    }
    return longest;
  }

  /** Quantos dos dias marcados caem no mês/ano de `reference`. */
  static countInMonth(
    log: ReadingLog,
    reference: CalendarDate = CalendarDate.today(),
  ): number {
    return log.markedDates().filter((date) => date.isSameMonth(reference)).length;
  }

  /** Monta o read model completo de estatísticas. */
  static compute(
    log: ReadingLog,
    today: CalendarDate = CalendarDate.today(),
  ): ReadingStats {
    return {
      total: log.total,
      currentStreak: ReadingStatsCalculator.currentStreak(log, today),
      longestStreak: ReadingStatsCalculator.longestStreak(log),
      thisMonth: ReadingStatsCalculator.countInMonth(log, today),
      readToday: log.isMarked(today),
    };
  }
}
