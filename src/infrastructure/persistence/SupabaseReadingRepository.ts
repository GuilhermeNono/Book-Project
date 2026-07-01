import { ReadingLog } from '../../domain/entities/ReadingLog';
import { IReadingRepository } from '../../domain/repositories/IReadingRepository';
import { supabase } from '../supabase/client';

const TABLE = 'reading_days';

/**
 * Adaptador de persistência que implementa `IReadingRepository` usando uma
 * tabela Supabase (Postgres) com Row Level Security escopando cada linha ao
 * usuário autenticado (`auth.uid()`).
 *
 * `save` calcula a diferença em relação ao último `load()` para enviar apenas
 * os dias que mudaram (insert/delete), em vez de reescrever a tabela inteira
 * a cada toque.
 */
export class SupabaseReadingRepository implements IReadingRepository {
  private lastLoaded = new Set<string>();

  async load(): Promise<ReadingLog> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('day, book_id, book_title')
      .order('day', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    const rows = data ?? [];
    this.lastLoaded = new Set(rows.map((row) => row.day as string));
    return ReadingLog.fromEntries(
      rows.map((row) => ({
        iso: row.day as string,
        bookId: (row.book_id as string | null) ?? null,
        bookTitle: (row.book_title as string | null) ?? null,
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
      const { error } = await supabase.from(TABLE).insert(
        toInsert.map((entry) => ({
          user_id: user.id,
          day: entry.iso,
          book_id: entry.bookId,
          book_title: entry.bookTitle,
        })),
      );
      if (error) {
        throw new Error(error.message);
      }
    }

    if (toDelete.length > 0) {
      const { error } = await supabase.from(TABLE).delete().in('day', toDelete);
      if (error) {
        throw new Error(error.message);
      }
    }

    this.lastLoaded = current;
  }
}
