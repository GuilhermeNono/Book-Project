import { Book } from '../../domain/entities/Book';
import { IShowcaseRepository } from '../../domain/repositories/IShowcaseRepository';
import { supabase } from '../supabase/client';

const TABLE = 'showcase_books';

interface ShowcaseRow {
  book_id: string;
  title: string;
  authors: string | null;
  cover_url: string | null;
}

function toBook(row: ShowcaseRow): Book {
  return {
    id: row.book_id,
    title: row.title,
    authors: row.authors ? row.authors.split(', ').filter(Boolean) : [],
    coverUrl: row.cover_url,
  };
}

/**
 * Adaptador de persistência que implementa `IShowcaseRepository` usando a
 * tabela Supabase `showcase_books`, com RLS escopando cada linha ao usuário
 * autenticado — mesmo padrão de `SupabaseReadingRepository`.
 */
export class SupabaseShowcaseRepository implements IShowcaseRepository {
  async load(): Promise<Book[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('book_id, title, authors, cover_url')
      .order('added_at', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map(toBook);
  }

  async add(book: Book): Promise<void> {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Usuário não autenticado.');
    }

    const { error } = await supabase.from(TABLE).insert({
      user_id: user.id,
      book_id: book.id,
      title: book.title,
      authors: book.authors.join(', ') || null,
      cover_url: book.coverUrl,
    });
    if (error) {
      throw new Error(error.message);
    }
  }

  async remove(bookId: string): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq('book_id', bookId);
    if (error) {
      throw new Error(error.message);
    }
  }
}
