import { create } from 'zustand';

import { ReadingEntry, ReadingLog } from '../../domain/entities/ReadingLog';
import { ReadingStats } from '../../domain/services/ReadingStats';
import { ReadingStatsCalculator } from '../../domain/services/ReadingStatsCalculator';
import { CalendarDate } from '../../domain/value-objects/CalendarDate';
import { container } from '../../infrastructure/di/container';

const EMPTY_STATS: ReadingStats = {
  total: 0,
  currentStreak: 0,
  longestStreak: 0,
  thisMonth: 0,
  readToday: false,
};

interface ReadingState {
  /** Datas marcadas em ISO — projeção da UI a partir do `ReadingLog`. */
  markedDates: string[];
  stats: ReadingStats;
  /** IDs dos livros do dia marcado mais recente que teve algum livro associado. */
  mostRecentBookIds: string[];
  loading: boolean;
  /** Requisição de marcar/desmarcar a leitura de hoje em voo (usado pelo `ReadButton`). */
  toggling: boolean;
  initialized: boolean;
  error: string | null;

  /** Carrega o estado inicial a partir do repositório. */
  init: () => Promise<void>;
  /** Alterna a leitura de hoje, opcionalmente associada a livro(s) da vitrine. */
  toggleToday: (entry?: ReadingEntry) => Promise<void>;
  /** Alterna a leitura de um dia arbitrário (ex.: toque no calendário). */
  toggleDate: (iso: string) => Promise<void>;
  /** Limpa o estado (usado ao trocar de usuário/logout, para não vazar dados). */
  reset: () => void;
}

/**
 * Store de apresentação. É a fronteira entre React e os casos de uso: nenhum
 * componente importa o `container` ou o domínio diretamente — tudo passa aqui.
 */
export const useReadingStore = create<ReadingState>((set) => {
  /** Deriva a projeção da UI (datas + estatísticas) de um `ReadingLog`. */
  const project = (log: ReadingLog) => ({
    markedDates: log.toISOList(),
    stats: ReadingStatsCalculator.compute(log),
    mostRecentBookIds: log.mostRecentBooks().map((book) => book.bookId),
    error: null,
  });

  return {
    markedDates: [],
    stats: EMPTY_STATS,
    mostRecentBookIds: [],
    loading: false,
    toggling: false,
    initialized: false,
    error: null,

    init: async () => {
      set({ loading: true });
      try {
        const log = await container.getReadingLog.execute();
        set({ ...project(log), loading: false, initialized: true });
      } catch (err) {
        set({
          loading: false,
          initialized: true,
          error: err instanceof Error ? err.message : 'Falha ao carregar dados.',
        });
      }
    },

    toggleToday: async (entry?: ReadingEntry) => {
      set({ toggling: true });
      try {
        const log = await container.toggleReadingDay.execute(CalendarDate.today(), entry);
        set({ ...project(log), toggling: false });
      } catch (err) {
        set({
          toggling: false,
          error: err instanceof Error ? err.message : 'Ação inválida.',
        });
      }
    },

    toggleDate: async (iso: string) => {
      try {
        const log = await container.toggleReadingDay.execute(
          CalendarDate.fromISO(iso),
        );
        set(project(log));
      } catch (err) {
        set({
          error: err instanceof Error ? err.message : 'Ação inválida.',
        });
      }
    },

    reset: () => {
      set({
        markedDates: [],
        stats: EMPTY_STATS,
        mostRecentBookIds: [],
        loading: false,
        toggling: false,
        initialized: false,
        error: null,
      });
    },
  };
});
