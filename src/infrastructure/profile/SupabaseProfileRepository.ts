import { Profile } from '../../domain/entities/Profile';
import { IProfileRepository } from '../../domain/repositories/IProfileRepository';
import { supabase } from '../supabase/client';

const TABLE = 'profiles';
const BUCKET = 'avatars';

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
 * Adaptador que implementa `IProfileRepository` usando a tabela Supabase
 * `profiles` e o bucket de Storage `avatars` (path `<user_id>/photo.jpg`).
 */
export class SupabaseProfileRepository implements IProfileRepository {
  async load(): Promise<Profile> {
    const userId = await currentUserId();
    const { data, error } = await supabase
      .from(TABLE)
      .select('display_name, avatar_url')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return {
      userId,
      displayName: data?.display_name ?? null,
      avatarUrl: data?.avatar_url ?? null,
    };
  }

  async updateAvatar(localUri: string): Promise<string> {
    const userId = await currentUserId();
    const path = `${userId}/photo.jpg`;

    // arrayBuffer é mais confiável que blob no React Native para uploads.
    const arrayBuffer = await fetch(localUri).then((res) => res.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, arrayBuffer, { contentType: 'image/jpeg', upsert: true });
    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    // Evita cache de imagem antiga com a mesma URL.
    const avatarUrl = `${publicUrlData.publicUrl}?updated=${Date.now()}`;

    const { error: upsertError } = await supabase
      .from(TABLE)
      .upsert({ user_id: userId, avatar_url: avatarUrl, updated_at: new Date().toISOString() });
    if (upsertError) {
      throw new Error(upsertError.message);
    }

    return avatarUrl;
  }

  async updateDisplayName(name: string): Promise<void> {
    const userId = await currentUserId();
    const { error } = await supabase
      .from(TABLE)
      .upsert({ user_id: userId, display_name: name, updated_at: new Date().toISOString() });
    if (error) {
      throw new Error(error.message);
    }
  }
}
