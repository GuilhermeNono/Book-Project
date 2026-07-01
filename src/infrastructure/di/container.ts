import { GetReadingLog } from '../../application/use-cases/GetReadingLog';
import { ToggleReadingDay } from '../../application/use-cases/ToggleReadingDay';
import { SignIn } from '../../application/use-cases/auth/SignIn';
import { SignOut } from '../../application/use-cases/auth/SignOut';
import { SignUp } from '../../application/use-cases/auth/SignUp';
import { IAuthRepository } from '../../domain/repositories/IAuthRepository';
import { IReadingRepository } from '../../domain/repositories/IReadingRepository';
import { SupabaseAuthRepository } from '../auth/SupabaseAuthRepository';
import { SupabaseReadingRepository } from '../persistence/SupabaseReadingRepository';

/**
 * Composition Root — o único lugar onde as implementações concretas são
 * "montadas". Trocar o Supabase por outro backend é uma mudança de duas
 * linhas aqui; nenhuma outra camada precisa mudar.
 */
const authRepository: IAuthRepository = new SupabaseAuthRepository();
const readingRepository: IReadingRepository = new SupabaseReadingRepository();

export const container = {
  authRepository,
  readingRepository,
  getReadingLog: new GetReadingLog(readingRepository),
  toggleReadingDay: new ToggleReadingDay(readingRepository),
  signUp: new SignUp(authRepository),
  signIn: new SignIn(authRepository),
  signOut: new SignOut(authRepository),
} as const;

export type Container = typeof container;
