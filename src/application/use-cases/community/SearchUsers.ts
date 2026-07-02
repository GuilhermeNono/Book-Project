import { PublicProfile } from '../../../domain/entities/PublicProfile';
import { IPublicProfileRepository } from '../../../domain/repositories/IPublicProfileRepository';

/** Caso de uso: busca usuários por nome de exibição. */
export class SearchUsers {
  constructor(private readonly repository: IPublicProfileRepository) {}

  execute(query: string): Promise<PublicProfile[]> {
    return this.repository.search(query);
  }
}
