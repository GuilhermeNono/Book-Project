/** Dados de perfil do usuário, além da sessão de autenticação. */
export interface Profile {
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
}
