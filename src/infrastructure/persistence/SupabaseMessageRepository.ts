import { Message } from '../../domain/entities/Message';
import { IMessageRepository } from '../../domain/repositories/IMessageRepository';
import { supabase } from '../supabase/client';

const TABLE = 'messages';

interface MessageRow {
  id: number;
  sender_id: string;
  recipient_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
}

function toMessage(row: MessageRow): Message {
  return {
    id: row.id,
    senderId: row.sender_id,
    recipientId: row.recipient_id,
    body: row.body,
    createdAt: row.created_at,
    readAt: row.read_at,
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
 * Adaptador que implementa `IMessageRepository` usando a tabela Supabase
 * `messages`, com entrega em tempo real via Supabase Realtime
 * (`postgres_changes`).
 */
export class SupabaseMessageRepository implements IMessageRepository {
  async listConversation(otherUserId: string): Promise<Message[]> {
    const me = await currentUserId();
    const { data, error } = await supabase
      .from(TABLE)
      .select('id, sender_id, recipient_id, body, created_at, read_at')
      .or(
        `and(sender_id.eq.${me},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${me})`,
      )
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map(toMessage);
  }

  async send(recipientId: string, body: string): Promise<Message> {
    const me = await currentUserId();
    const { data, error } = await supabase
      .from(TABLE)
      .insert({ sender_id: me, recipient_id: recipientId, body })
      .select('id, sender_id, recipient_id, body, created_at, read_at')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return toMessage(data);
  }

  async markConversationRead(otherUserId: string): Promise<void> {
    const me = await currentUserId();
    const { error } = await supabase
      .from(TABLE)
      .update({ read_at: new Date().toISOString() })
      .eq('sender_id', otherUserId)
      .eq('recipient_id', me)
      .is('read_at', null);

    if (error) {
      throw new Error(error.message);
    }
  }

  /**
   * O filtro de `postgres_changes` só suporta uma comparação simples de
   * coluna, então esta assinatura só recebe mensagens *vindas* do amigo
   * (`sender_id`); mensagens enviadas pelo próprio usuário chegam pelo
   * retorno otimista de `send()`, não por este canal.
   */
  subscribeToConversation(otherUserId: string, onMessage: (message: Message) => void): () => void {
    const channel = supabase
      .channel(`messages:${otherUserId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: TABLE, filter: `sender_id=eq.${otherUserId}` },
        (payload) => onMessage(toMessage(payload.new as MessageRow)),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}
