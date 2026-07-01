import { Book } from '../entities/Book';

/**
 * Porta do domínio para buscar livros em um catálogo público externo
 * (ex.: Google Books). A infraestrutura decide qual API usar.
 */
export interface IBookCatalogRepository {
  search(query: string): Promise<Book[]>;
}
