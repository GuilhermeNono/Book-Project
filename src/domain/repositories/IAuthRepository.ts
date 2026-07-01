import { Session } from '../entities/Session';

/**
 * Porta (Port) do domínio para autenticação de usuário.
 *
 * Assim como `IReadingRepository`, isola as regras de negócio do provedor de
 * auth concreto (Supabase Auth, Firebase Auth, etc.).
 */
export interface IAuthRepository {
  signUp(email: string, password: string): Promise<Session>;
  signIn(email: string, password: string): Promise<Session>;
  signOut(): Promise<void>;

  /** Sessão atual, ou `null` se não houver usuário autenticado. */
  getSession(): Promise<Session | null>;

  /** Notifica mudanças de sessão (login/logout/refresh). Retorna um unsubscribe. */
  onSessionChange(callback: (session: Session | null) => void): () => void;
}
