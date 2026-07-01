/**
 * Representa um usuário autenticado. É deliberadamente mínima — o domínio de
 * leitura só precisa saber "quem" para escopar os dados, nada além disso.
 */
export interface Session {
  userId: string;
  email: string | null;
}
