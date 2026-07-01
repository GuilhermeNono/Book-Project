import { Session } from '../../domain/entities/Session';
import { IAuthRepository } from '../../domain/repositories/IAuthRepository';
import { supabase } from '../supabase/client';

function toSession(user: { id: string; email?: string | null } | null): Session | null {
  if (!user) {
    return null;
  }
  return { userId: user.id, email: user.email ?? null };
}

/** Adaptador que implementa `IAuthRepository` usando o Supabase Auth. */
export class SupabaseAuthRepository implements IAuthRepository {
  async signUp(email: string, password: string): Promise<Session> {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      throw new Error(error.message);
    }
    if (!data.session) {
      // Projeto configurado para exigir confirmação de email antes do login.
      throw new Error(
        'Conta criada! Confirme seu email antes de entrar (verifique a caixa de entrada).',
      );
    }
    return toSession(data.user)!;
  }

  async signIn(email: string, password: string): Promise<Session> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      throw new Error(error.message);
    }
    return toSession(data.user)!;
  }

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  }

  async getSession(): Promise<Session | null> {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      throw new Error(error.message);
    }
    return toSession(data.session?.user ?? null);
  }

  onSessionChange(callback: (session: Session | null) => void): () => void {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(toSession(session?.user ?? null));
    });
    return () => data.subscription.unsubscribe();
  }
}
