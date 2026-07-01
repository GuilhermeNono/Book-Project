import { IShowcaseRepository } from '../../../domain/repositories/IShowcaseRepository';

/** Caso de uso: remover um livro da vitrine do usuário. */
export class RemoveFromShowcase {
  constructor(private readonly repository: IShowcaseRepository) {}

  execute(bookId: string): Promise<void> {
    return this.repository.remove(bookId);
  }
}
