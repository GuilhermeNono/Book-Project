/**
 * Read model de domínio: estatísticas derivadas do registro de leituras.
 *
 * É um objeto de leitura (sem comportamento) consumido pela UI para exibir
 * progresso — não é persistido, e sim recalculado a partir do `ReadingLog`.
 */
export interface ReadingStats {
  /** Total de dias marcados como lidos. */
  total: number;
  /** Sequência atual de dias consecutivos lidos (terminando hoje ou ontem). */
  currentStreak: number;
  /** Maior sequência de dias consecutivos já alcançada. */
  longestStreak: number;
  /** Quantidade de dias lidos no mês corrente. */
  thisMonth: number;
  /** Se o dia de hoje já foi marcado. */
  readToday: boolean;
}
