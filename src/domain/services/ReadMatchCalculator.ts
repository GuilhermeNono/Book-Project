import { Book } from '../entities/Book';
import { ReadingLog } from '../entities/ReadingLog';
import { CalendarDate } from '../value-objects/CalendarDate';
import { MonthBreakdown, ReadMatch, ReadMatchLeader } from './ReadMatch';
import { ReadingStatsCalculator } from './ReadingStatsCalculator';

function compareLeader(selfValue: number, friendValue: number): ReadMatchLeader {
  if (selfValue === friendValue) {
    return 'tie';
  }
  return selfValue > friendValue ? 'self' : 'friend';
}

/**
 * Domain Service: compara a atividade de leitura de dois usuários na janela
 * dos últimos 3 meses civis (não 90 dias corridos — janela civil dá uma
 * grade mensal limpa em `monthly`). Reaproveita `ReadingStatsCalculator`
 * (sem reimplementar streak/total) sobre logs já recortados para a janela.
 */
export class ReadMatchCalculator {
  /** Primeiro dia do mês que é 2 meses antes do mês de `today` (início da janela de 3 meses civis). */
  static windowStart(today: CalendarDate = CalendarDate.today()): CalendarDate {
    return CalendarDate.fromDate(new Date(today.year, today.month - 3, 1));
  }

  /** Recorta um `ReadingLog` completo para apenas os dias dentro da janela de 3 meses civis. */
  static last3MonthsWindow(log: ReadingLog, today: CalendarDate = CalendarDate.today()): ReadingLog {
    const startISO = ReadMatchCalculator.windowStart(today).toISO();
    return ReadingLog.fromEntries(log.toEntryList().filter((entry) => entry.iso >= startISO));
  }

  /** Quebra por mês (contagem de dias lidos) dentro da janela, para os dois usuários. */
  static monthlyBreakdown(
    selfLog: ReadingLog,
    friendLog: ReadingLog,
    today: CalendarDate = CalendarDate.today(),
  ): MonthBreakdown[] {
    const start = ReadMatchCalculator.windowStart(today);
    const months = [0, 1, 2].map((offset) =>
      CalendarDate.fromDate(new Date(start.year, start.month - 1 + offset, 1)),
    );
    return months.map((marker) => ({
      month: `${marker.year}-${String(marker.month).padStart(2, '0')}`,
      selfCount: ReadingStatsCalculator.countInMonth(selfLog, marker),
      friendCount: ReadingStatsCalculator.countInMonth(friendLog, marker),
    }));
  }

  /**
   * Monta o read model completo do Read Match. `selfLogFull`/`friendLogFull`
   * podem vir já filtrados pelo repositório (otimização de query) — aqui são
   * recortados de novo para a janela exata, garantindo que a fonte de
   * verdade do limite da janela seja sempre este serviço.
   */
  static compute(
    selfLogFull: ReadingLog,
    friendLogFull: ReadingLog,
    selfShowcase: readonly Book[],
    friendShowcase: readonly Book[],
    today: CalendarDate = CalendarDate.today(),
  ): ReadMatch {
    const selfLog = ReadMatchCalculator.last3MonthsWindow(selfLogFull, today);
    const friendLog = ReadMatchCalculator.last3MonthsWindow(friendLogFull, today);

    const self = ReadingStatsCalculator.compute(selfLog, today);
    const friend = ReadingStatsCalculator.compute(friendLog, today);
    const monthly = ReadMatchCalculator.monthlyBreakdown(selfLog, friendLog, today);

    const friendDates = new Set(friendLog.markedDates().map((date) => date.toISO()));
    const daysBothRead = selfLog.markedDates().filter((date) => friendDates.has(date.toISO())).length;

    const friendBookIds = new Set(friendShowcase.map((book) => book.id));
    const showcaseOverlapCount = selfShowcase.filter((book) => friendBookIds.has(book.id)).length;

    return {
      self,
      friend,
      monthly,
      showcaseOverlapCount,
      daysBothRead,
      leader: {
        total: compareLeader(self.total, friend.total),
        currentStreak: compareLeader(self.currentStreak, friend.currentStreak),
        longestStreak: compareLeader(self.longestStreak, friend.longestStreak),
      },
    };
  }
}
