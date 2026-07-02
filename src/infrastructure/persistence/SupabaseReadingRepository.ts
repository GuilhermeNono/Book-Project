import { BookRef, ReadingLog } from '../../domain/entities/ReadingLog';
import { IReadingRepository } from '../../domain/repositories/IReadingRepository';
import { supabase } from '../supabase/client';

const DAYS_TABLE = 'reading_days';
const BOOKS_TABLE = 'reading_day_books';

/**
 * Adaptador de persistência que implementa `IReadingRepository` usando tabelas
 * Supabase (Postgres) com Row Level Security escopando cada linha ao usuário
 * autenticado (`auth.uid()`).
 *
 * Um dia lido vive em `reading_days` (o marcador do dia); os livros lidos
 * naquele dia (zero ou mais) vivem em `reading_day_books`, ligados por
 * `(user_id, day)`. `save` calcula a diferença em relação ao último `load()`
 * para enviar apenas os dias que mudaram (insert/delete no nível do dia — não
 * há suporte a editar os livros de um dia já marcado sem desmarcar/remarcar).
 */
export class SupabaseReadingRepository implements IReadingRepository {
  private lastLoaded = new Set<string>();

  async load(): Promise<ReadingLog> {
    const [daysResult, booksResult] = await Promise.all([
      supabase.from(DAYS_TABLE).select('day').order('day', { ascending: true }),
      supabase.from(BOOKS_TABLE).select('day, book_id, book_title'),
    ]);

    if (daysResult.error) {
      throw new Error(daysResult.error.message);
    }
    if (booksResult.error) {
      throw new Error(booksResult.error.message);
    }

    const days = daysResult.data ?? [];
    const bookRows = booksResult.data ?? [];

    const booksByDay = new Map<string, BookRef[]>();
    for (const row of bookRows) {
      const iso = row.day as string;
      const list = booksByDay.get(iso) ?? [];
      list.push({ bookId: row.book_id as string, bookTitle: row.book_title as string });
      booksByDay.set(iso, list);
    }

    this.lastLoaded = new Set(days.map((row) => row.day as string));
    return ReadingLog.fromEntries(
      days.map((row) => ({
        iso: row.day as string,
        books: booksByDay.get(row.day as string) ?? [],
      })),
    );
  }

  async save(log: ReadingLog): Promise<void> {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Usuário não autenticado.');
    }

    const entries = log.toEntryList();
    const current = new Set(entries.map((entry) => entry.iso));
    const toInsert = entries.filter((entry) => !this.lastLoaded.has(entry.iso));
    const toDelete = [...this.lastLoaded].filter((day) => !current.has(day));

    if (toInsert.length > 0) {
      const { error } = await supabase.from(DAYS_TABLE).insert(
        toInsert.map((entry) => ({
          user_id: user.id,
          day: entry.iso,
        })),
      );
      if (error) {
        throw new Error(error.message);
      }

      const bookRows = toInsert.flatMap((entry) =>
        entry.books.map((book) => ({
          user_id: user.id,
          day: entry.iso,
          book_id: book.bookId,
          book_title: book.bookTitle,
        })),
      );
      if (bookRows.length > 0) {
        const { error: booksError } = await supabase.from(BOOKS_TABLE).insert(bookRows);
        if (booksError) {
          throw new Error(booksError.message);
        }
      }
    }

    if (toDelete.length > 0) {
      // A FK de reading_day_books para reading_days tem ON DELETE CASCADE.
      const { error } = await supabase.from(DAYS_TABLE).delete().in('day', toDelete);
      if (error) {
        throw new Error(error.message);
      }
    }

    this.lastLoaded = current;
  }
}
