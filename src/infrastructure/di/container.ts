import { CheckForUpdate } from '../../application/use-cases/CheckForUpdate';
import { GetReadingLog } from '../../application/use-cases/GetReadingLog';
import { SearchBooks } from '../../application/use-cases/SearchBooks';
import { ToggleReadingDay } from '../../application/use-cases/ToggleReadingDay';
import { SignIn } from '../../application/use-cases/auth/SignIn';
import { SignOut } from '../../application/use-cases/auth/SignOut';
import { SignUp } from '../../application/use-cases/auth/SignUp';
import { GetConversation } from '../../application/use-cases/chat/GetConversation';
import { MarkConversationRead } from '../../application/use-cases/chat/MarkConversationRead';
import { SendMessage } from '../../application/use-cases/chat/SendMessage';
import { GetPublicShowcase } from '../../application/use-cases/community/GetPublicShowcase';
import { SearchUsers } from '../../application/use-cases/community/SearchUsers';
import { AcceptFriendRequest } from '../../application/use-cases/friends/AcceptFriendRequest';
import { DeclineFriendRequest } from '../../application/use-cases/friends/DeclineFriendRequest';
import { GetFriends } from '../../application/use-cases/friends/GetFriends';
import { GetPendingRequestsCount } from '../../application/use-cases/friends/GetPendingRequestsCount';
import { RemoveFriend } from '../../application/use-cases/friends/RemoveFriend';
import { SendFriendRequest } from '../../application/use-cases/friends/SendFriendRequest';
import { GetProfile } from '../../application/use-cases/profile/GetProfile';
import { UpdateAvatar } from '../../application/use-cases/profile/UpdateAvatar';
import { UpdateDisplayName } from '../../application/use-cases/profile/UpdateDisplayName';
import { CompareReadingActivity } from '../../application/use-cases/readmatch/CompareReadingActivity';
import { AddToShowcase } from '../../application/use-cases/showcase/AddToShowcase';
import { GetShowcase } from '../../application/use-cases/showcase/GetShowcase';
import { RemoveFromShowcase } from '../../application/use-cases/showcase/RemoveFromShowcase';
import { IAppVersionRepository } from '../../domain/repositories/IAppVersionRepository';
import { IAuthRepository } from '../../domain/repositories/IAuthRepository';
import { IBookCatalogRepository } from '../../domain/repositories/IBookCatalogRepository';
import { IFriendshipRepository } from '../../domain/repositories/IFriendshipRepository';
import { IMessageRepository } from '../../domain/repositories/IMessageRepository';
import { IProfileRepository } from '../../domain/repositories/IProfileRepository';
import { IPublicProfileRepository } from '../../domain/repositories/IPublicProfileRepository';
import { IReadMatchRepository } from '../../domain/repositories/IReadMatchRepository';
import { IReadingRepository } from '../../domain/repositories/IReadingRepository';
import { IShowcaseRepository } from '../../domain/repositories/IShowcaseRepository';
import { SupabaseAuthRepository } from '../auth/SupabaseAuthRepository';
import { GoogleBooksCatalogRepository } from '../catalog/GoogleBooksCatalogRepository';
import { SupabaseFriendshipRepository } from '../persistence/SupabaseFriendshipRepository';
import { SupabaseMessageRepository } from '../persistence/SupabaseMessageRepository';
import { SupabasePublicProfileRepository } from '../persistence/SupabasePublicProfileRepository';
import { SupabaseReadMatchRepository } from '../persistence/SupabaseReadMatchRepository';
import { SupabaseReadingRepository } from '../persistence/SupabaseReadingRepository';
import { SupabaseShowcaseRepository } from '../persistence/SupabaseShowcaseRepository';
import { SupabaseProfileRepository } from '../profile/SupabaseProfileRepository';
import { SupabaseAppVersionRepository } from '../version/SupabaseAppVersionRepository';

/**
 * Composition Root — o único lugar onde as implementações concretas são
 * "montadas". Trocar o Supabase por outro backend é uma mudança de duas
 * linhas aqui; nenhuma outra camada precisa mudar.
 */
const authRepository: IAuthRepository = new SupabaseAuthRepository();
const readingRepository: IReadingRepository = new SupabaseReadingRepository();
const bookCatalogRepository: IBookCatalogRepository = new GoogleBooksCatalogRepository();
const showcaseRepository: IShowcaseRepository = new SupabaseShowcaseRepository();
const profileRepository: IProfileRepository = new SupabaseProfileRepository();
const appVersionRepository: IAppVersionRepository = new SupabaseAppVersionRepository();
const friendshipRepository: IFriendshipRepository = new SupabaseFriendshipRepository();
const messageRepository: IMessageRepository = new SupabaseMessageRepository();
const publicProfileRepository: IPublicProfileRepository = new SupabasePublicProfileRepository();
const readMatchRepository: IReadMatchRepository = new SupabaseReadMatchRepository();

export const container = {
  authRepository,
  readingRepository,
  showcaseRepository,
  profileRepository,
  appVersionRepository,
  friendshipRepository,
  // Exposto direto (sem caso de uso) para a store poder chamar
  // subscribeToConversation — mesma exceção documentada de authRepository.
  messageRepository,
  publicProfileRepository,
  getReadingLog: new GetReadingLog(readingRepository),
  toggleReadingDay: new ToggleReadingDay(readingRepository),
  signUp: new SignUp(authRepository),
  signIn: new SignIn(authRepository),
  signOut: new SignOut(authRepository),
  searchBooks: new SearchBooks(bookCatalogRepository),
  getShowcase: new GetShowcase(showcaseRepository),
  addToShowcase: new AddToShowcase(showcaseRepository),
  removeFromShowcase: new RemoveFromShowcase(showcaseRepository),
  getProfile: new GetProfile(profileRepository),
  updateAvatar: new UpdateAvatar(profileRepository),
  updateDisplayName: new UpdateDisplayName(profileRepository),
  checkForUpdate: new CheckForUpdate(appVersionRepository),
  getFriends: new GetFriends(friendshipRepository, publicProfileRepository),
  sendFriendRequest: new SendFriendRequest(friendshipRepository),
  acceptFriendRequest: new AcceptFriendRequest(friendshipRepository),
  declineFriendRequest: new DeclineFriendRequest(friendshipRepository),
  removeFriend: new RemoveFriend(friendshipRepository),
  getPendingRequestsCount: new GetPendingRequestsCount(friendshipRepository),
  getConversation: new GetConversation(messageRepository),
  sendMessage: new SendMessage(messageRepository),
  markConversationRead: new MarkConversationRead(messageRepository),
  searchUsers: new SearchUsers(publicProfileRepository),
  getPublicShowcase: new GetPublicShowcase(publicProfileRepository),
  compareReadingActivity: new CompareReadingActivity(
    readMatchRepository,
    friendshipRepository,
    showcaseRepository,
    publicProfileRepository,
  ),
} as const;

export type Container = typeof container;
