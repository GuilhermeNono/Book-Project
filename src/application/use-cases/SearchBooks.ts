import { Book } from '../../domain/entities/Book';
import { IBookCatalogRepository } from '../../domain/repositories/IBookCatalogRepository';

/** Caso de uso: buscar livros em um catálogo público externo. */
export class SearchBooks {
  constructor(private readonly repository: IBookCatalogRepository) {}

  execute(query: string): Promise<Book[]> {
    return this.repository.search(query);
  }
}
  