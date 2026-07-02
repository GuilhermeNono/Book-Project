import { BookRef, ReadingLog } from '../../domain/entities/ReadingLog';
import { IReadMatchRepository } from '../../domain/repositories/IReadMatchRepository';
import { supabase } from '../supabase/client';

const DAYS_TABLE = 'reading_days';
const BOOKS_TABLE = 'reading_day_books';

async function currentUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('Usuário não autenticado.');
  }
  return user.id;
}

async function loadSince(userId: string, sinceISO: string): Promise<ReadingLog> {
  const [daysResult, booksResult] = await Promise.all([
    supabase.from(DAYS_TABLE).select('day').eq('user_id', userId).gte('day', sinceISO).order('day', { ascending: true }),
    supabase.from(BOOKS_TABLE).select('day, book_id, book_title').eq('user_id', userId).gte('day', sinceISO),
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

  return ReadingLog.fromEntries(
    days.map((row) => ({
      iso: row.day as string,
      books: booksByDay.get(row.day as string) ?? [],
    })),
  );
}

/**
 * Adaptador somente-leitura para o Read Match: lê `reading_days`/
 * `reading_day_books` de um usuário (próprio ou amigo) a partir de uma data.
 * Sem `save()` — não acompanha `lastLoaded` como `SupabaseReadingRepository`.
 * A leitura de um amigo só retorna linhas graças à RLS "Friends can view
 * reading days for Read Match" (migrations/010720262330.sql); sem amizade
 * aceita, o Postgres devolve uma lista vazia, não um erro.
 */
export class SupabaseReadMatchRepository implements IReadMatchRepository {
  async loadOwnSince(sinceISO: string): Promise<ReadingLog> {
    const me = await currentUserId();
    return loadSince(me, sinceISO);
  }

  async loadFriendSince(otherUserId: string, sinceISO: string): Promise<ReadingLog> {
    return loadSince(otherUserId, sinceISO);
  }
}
