import { AppVersion } from '../../domain/entities/AppVersion';
import { IAppVersionRepository } from '../../domain/repositories/IAppVersionRepository';
import { supabase } from '../supabase/client';

const TABLE = 'app_versions';

/**
 * Adaptador que implementa `IAppVersionRepository` usando a tabela Supabase
 * `app_versions`. As linhas são gravadas pelo workflow de CI (com a service
 * role key, fora do app) a cada build de produção no EAS; o app só lê.
 */
export class SupabaseAppVersionRepository implements IAppVersionRepository {
  async getLatest(): Promise<AppVersion | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('version, apk_url, release_notes')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }
    if (!data) {
      return null;
    }

    return {
      version: data.version as string,
      apkUrl: data.apk_url as string,
      releaseNotes: (data.release_notes as string | null) ?? null,
    };
  }
}
