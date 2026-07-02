import { Friendship, FriendshipStatus } from '../../domain/entities/Friendship';
import { IFriendshipRepository } from '../../domain/repositories/IFriendshipRepository';
import { FriendshipHelpers } from '../../domain/services/FriendshipHelpers';
import { supabase } from '../supabase/client';

const TABLE = 'friendships';

interface FriendshipRow {
  user_low: string;
  user_high: string;
  requested_by: string;
  status: FriendshipStatus;
  created_at: string;
}

function toFriendship(row: FriendshipRow): Friendship {
  return {
    userLow: row.user_low,
    userHigh: row.user_high,
    requestedBy: row.requested_by,
    status: row.status,
    createdAt: row.created_at,
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
 * Adaptador que implementa `IFriendshipRepository` usando a tabela Supabase
 * `friendships` (par ordenado `user_low < user_high`, uma linha por amizade).
 */
export class SupabaseFriendshipRepository implements IFriendshipRepository {
  async listForCurrentUser(): Promise<Friendship[]> {
    const me = await currentUserId();
    const { data, error } = await supabase
      .from(TABLE)
      .select('user_low, user_high, requested_by, status, created_at')
      .or(`user_low.eq.${me},user_high.eq.${me}`);

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map(toFriendship);
  }

  async sendRequest(targetUserId: string): Promise<Friendship> {
    const me = await currentUserId();
    const { userLow, userHigh } = FriendshipHelpers.sortedPair(me, targetUserId);

    const { data, error } = await supabase
      .from(TABLE)
      .insert({ user_low: userLow, user_high: userHigh, requested_by: me, status: 'pending' })
      .select('user_low, user_high, requested_by, status, created_at')
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Já existe uma amizade ou convite pendente com este usuário.');
      }
      throw new Error(error.message);
    }

    return toFriendship(data);
  }

  async accept(otherUserId: string): Promise<Friendship> {
    const me = await currentUserId();
    const { userLow, userHigh } = FriendshipHelpers.sortedPair(me, otherUserId);

    const { data, error } = await supabase
      .from(TABLE)
      .update({ status: 'accepted', responded_at: new Date().toISOString() })
      .eq('user_low', userLow)
      .eq('user_high', userHigh)
      .select('user_low, user_high, requested_by, status, created_at')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return toFriendship(data);
  }

  async decline(otherUserId: string): Promise<void> {
    await this.deletePair(otherUserId);
  }

  async unfriend(otherUserId: string): Promise<void> {
    await this.deletePair(otherUserId);
  }

  private async deletePair(otherUserId: string): Promise<void> {
    const me = await currentUserId();
    const { userLow, userHigh } = FriendshipHelpers.sortedPair(me, otherUserId);

    const { error } = await supabase.from(TABLE).delete().eq('user_low', userLow).eq('user_high', userHigh);
    if (error) {
      throw new Error(error.message);
    }
  }
}
