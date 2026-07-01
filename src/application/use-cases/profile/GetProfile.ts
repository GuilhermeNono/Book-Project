import { Profile } from '../../../domain/entities/Profile';
import { IProfileRepository } from '../../../domain/repositories/IProfileRepository';

/** Caso de uso: recuperar o perfil do usuário. */
export class GetProfile {
  constructor(private readonly repository: IProfileRepository) {}

  execute(): Promise<Profile> {
    return this.repository.load();
  }
}
