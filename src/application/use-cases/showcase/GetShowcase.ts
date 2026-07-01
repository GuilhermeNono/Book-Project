import { Book } from '../../../domain/entities/Book';
import { IShowcaseRepository } from '../../../domain/repositories/IShowcaseRepository';

/** Caso de uso: recuperar os livros da vitrine do usuário. */
export class GetShowcase {
  constructor(private readonly repository: IShowcaseRepository) {}

  execute(): Promise<Book[]> {
    return this.repository.load();
  }
}
