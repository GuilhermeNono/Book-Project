/**
 * Perfil público de outro usuário (resultado de busca, membro da lista de
 * amigos, etc.). Deliberadamente separado de `Profile`: representa "perfil
 * de alguém que não sou eu" e nunca deve ser usado com os casos de uso
 * self-only (`UpdateAvatar`, `UpdateDisplayName`).
 */
export interface PublicProfile {
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
}
