import { IAuthRepository } from '../../../domain/repositories/IAuthRepository';

/** Caso de uso: encerrar a sessão do usuário atual. */
export class SignOut {
  constructor(private readonly authRepository: IAuthRepository) {}

  execute(): Promise<void> {
    return this.authRepository.signOut();
  }
}
