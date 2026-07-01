import { Session } from '../../../domain/entities/Session';
import { IAuthRepository } from '../../../domain/repositories/IAuthRepository';

/** Caso de uso: autenticar com email e senha. */
export class SignIn {
  constructor(private readonly authRepository: IAuthRepository) {}

  execute(email: string, password: string): Promise<Session> {
    return this.authRepository.signIn(email, password);
  }
}
