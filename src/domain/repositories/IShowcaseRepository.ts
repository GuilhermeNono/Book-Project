import { Book } from '../entities/Book';

/** Porta do domínio para a vitrine de livros do usuário. */
export interface IShowcaseRepository {
  load(): Promise<Book[]>;
  add(book: Book): Promise<void>;
  remove(bookId: string): Promise<void>;
}
