import { Book } from '../../../domain/entities/Book';
import { IShowcaseRepository } from '../../../domain/repositories/IShowcaseRepository';

/** Caso de uso: adicionar um livro à vitrine do usuário. */
export class AddToShowcase {
  constructor(private readonly repository: IShowcaseRepository) {}

  execute(book: Book): Promise<void> {
    return this.repository.add(book);
  }
}
