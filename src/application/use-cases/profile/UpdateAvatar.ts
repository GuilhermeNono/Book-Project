import { IProfileRepository } from '../../../domain/repositories/IProfileRepository';

/** Caso de uso: trocar a foto de perfil do usuário. */
export class UpdateAvatar {
  constructor(private readonly repository: IProfileRepository) {}

  execute(localUri: string): Promise<string> {
    return this.repository.updateAvatar(localUri);
  }
}
