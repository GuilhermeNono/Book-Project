import { Book } from '../../domain/entities/Book';
import { PublicProfile } from '../../domain/entities/PublicProfile';
import { IPublicProfileRepository } from '../../domain/repositories/IPublicProfileRepository';
import { supabase } from '../supabase/client';

const PROFILES_TABLE = 'profiles';
const SHOWCASE_TABLE = 'showcase_books';
const SEARCH_LIMIT = 20;

interface ProfileRow {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface ShowcaseRow {
  book_id: string;
  title: string;
  authors: string | null;
  cover_url: string | null;
}

function toPublicProfile(row: ProfileRow): PublicProfile {
  return { userId: row.user_id, displayName: row.display_name, avatarUrl: row.avatar_url };
}

function toBook(row: ShowcaseRow): Book {
  return {
    id: row.book_id,
    title: row.title,
    authors: row.authors ? row.authors.split(', ').filter(Boolean) : [],
    coverUrl: row.cover_url,
  };
}

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

/**
 * Adaptador que implementa `IPublicProfileRepository`: busca de perfis por
 * nome (`profiles.display_name`, RLS pública) e leitura da vitrine de
 * qualquer usuário (`showcase_books`, RLS pública) — mesmo padrão de
 * `SupabaseProfileRepository`/`SupabaseShowcaseRepository`, mas escopado por
 * `userId` explícito em vez de `auth.uid()` implícito.
 */
export class SupabasePublicProfileRepository implements IPublicProfileRepository {
  async search(query: string): Promise<PublicProfile[]> {
    const me = await currentUserId();
    const { data, error } = await supabase
      .from(PROFILES_TABLE)
      .select('user_id, display_name, avatar_url')
      .ilike('display_name', `%${query}%`)
      .neq('user_id', me)
      .limit(SEARCH_LIMIT);

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map(toPublicProfile);
  }

  async getManyByIds(userIds: string[]): Promise<PublicProfile[]> {
    if (userIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from(PROFILES_TABLE)
      .select('user_id, display_name, avatar_url')
      .in('user_id', userIds);

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map(toPublicProfile);
  }

  async getShowcaseFor(userId: string): Promise<Book[]> {
    const { data, error } = await supabase
      .from(SHOWCASE_TABLE)
      .select('book_id, title, authors, cover_url')
      .eq('user_id', userId)
      .order('added_at', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map(toBook);
  }
}
