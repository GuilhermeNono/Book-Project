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
      .select('day')
      .order('day', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    const isoDates = (data ?? []).map((row) => row.day as string);
    this.lastLoaded = new Set(isoDates);
    return ReadingLog.fromISOList(isoDates);
  }

  async save(log: ReadingLog): Promise<void> {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Usuário não autenticado.');
    }

    const current = new Set(log.toISOList());
    const toInsert = [...current].filter((day) => !this.lastLoaded.has(day));
    const toDelete = [...this.lastLoaded].filter((day) => !current.has(day));

    if (toInsert.length > 0) {
      const { error } = await supabase
        .from(TABLE)
        .insert(toInsert.map((day) => ({ user_id: user.id, day })));
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
