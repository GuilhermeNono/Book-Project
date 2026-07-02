export type FriendshipStatus = 'pending' | 'accepted';

/**
 * Amizade entre dois usuários. Representada como um par ordenado
 * (`userLow < userHigh`) — uma única linha por par, sem duplicidade
 * assimétrica. `requestedBy` identifica quem enviou o convite original.
 */
export interface Friendship {
  userLow: string;
  userHigh: string;
  requestedBy: string;
  status: FriendshipStatus;
  createdAt: string;
}
