import { Book } from '../../../domain/entities/Book';
import { IPublicProfileRepository } from '../../../domain/repositories/IPublicProfileRepository';

/** Caso de uso: recupera a vitrine de qualquer usuário, mesmo sem amizade. */
export class GetPublicShowcase {
  constructor(private readonly repository: IPublicProfileRepository) {}

  execute(userId: string): Promise<Book[]> {
    return this.repository.getShowcaseFor(userId);
  }
}
