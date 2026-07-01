import { IProfileRepository } from '../../../domain/repositories/IProfileRepository';

/** Caso de uso: atualizar o nome de exibição do usuário. */
export class UpdateDisplayName {
  constructor(private readonly repository: IProfileRepository) {}

  execute(name: string): Promise<void> {
    return this.repository.updateDisplayName(name);
  }
}
