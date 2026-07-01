import { Session } from '../../../domain/entities/Session';
import { IAuthRepository } from '../../../domain/repositories/IAuthRepository';

/** Caso de uso: criar uma nova conta. */
export class SignUp {
  constructor(private readonly authRepository: IAuthRepository) {}

  execute(email: string, password: string): Promise<Session> {
    return this.authRepository.signUp(email, password);
  }
}
