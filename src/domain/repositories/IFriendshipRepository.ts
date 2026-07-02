import { Friendship } from '../entities/Friendship';

/** Porta do domínio para o grafo de amizades do usuário atual. */
export interface IFriendshipRepository {
  /** Todas as amizades (pendentes e aceitas) que envolvem o usuário atual. */
  listForCurrentUser(): Promise<Friendship[]>;
  /** Envia um convite de amizade para outro usuário. */
  sendRequest(targetUserId: string): Promise<Friendship>;
  /** Aceita um convite pendente recebido de `otherUserId`. */
  accept(otherUserId: string): Promise<Friendship>;
  /** Recusa um convite pendente recebido de `otherUserId` (remove a linha). */
  decline(otherUserId: string): Promise<void>;
  /** Desfaz uma amizade já aceita com `otherUserId` (remove a linha). */
  unfriend(otherUserId: string): Promise<void>;
}
