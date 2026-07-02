import { ReadingStats } from './ReadingStats';

/** Contagem de dias lidos em um mês da janela de comparação, para os dois usuários. */
export interface MonthBreakdown {
  /** "YYYY-MM" */
  month: string;
  selfCount: number;
  friendCount: number;
}

export type ReadMatchLeader = 'self' | 'friend' | 'tie';

/**
 * Read model de domínio: resultado da comparação "Read Match" entre o
 * usuário atual e um amigo, sobre a janela dos últimos 3 meses civis.
 */
export interface ReadMatch {
  self: ReadingStats;
  friend: ReadingStats;
  /** Um item por mês da janela, do mais antigo para o mais recente. */
  monthly: MonthBreakdown[];
  /** Quantos livros aparecem nas vitrines dos dois usuários. */
  showcaseOverlapCount: number;
  /** Quantos dias, dentro da janela, os dois usuários leram. */
  daysBothRead: number;
  leader: {
    total: ReadMatchLeader;
    currentStreak: ReadMatchLeader;
    longestStreak: ReadMatchLeader;
  };
}
