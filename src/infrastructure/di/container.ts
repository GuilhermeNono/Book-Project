import { CheckForUpdate } from '../../application/use-cases/CheckForUpdate';
import { GetReadingLog } from '../../application/use-cases/GetReadingLog';
import { SearchBooks } from '../../application/use-cases/SearchBooks';
import { ToggleReadingDay } from '../../application/use-cases/ToggleReadingDay';
import { SignIn } from '../../application/use-cases/auth/SignIn';
import { SignOut } from '../../application/use-cases/auth/SignOut';
import { SignUp } from '../../application/use-cases/auth/SignUp';
import { GetProfile } from '../../application/use-cases/profile/GetProfile';
import { UpdateAvatar } from '../../application/use-cases/profile/UpdateAvatar';
import { UpdateDisplayName } from '../../application/use-cases/profile/UpdateDisplayName';
import { AddToShowcase } from '../../application/use-cases/showcase/AddToShowcase';
import { GetShowcase } from '../../application/use-cases/showcase/GetShowcase';
import { RemoveFromShowcase } from '../../application/use-cases/showcase/RemoveFromShowcase';
import { IAppVersionRepository } from '../../domain/repositories/IAppVersionRepository';
import { IAuthRepository } from '../../domain/repositories/IAuthRepository';
import { IBookCatalogRepository } from '../../domain/repositories/IBookCatalogRepository';
import { IProfileRepository } from '../../domain/repositories/IProfileRepository';
import { IReadingRepository } from '../../domain/repositories/IReadingRepository';
import { IShowcaseRepository } from '../../domain/repositories/IShowcaseRepository';
import { SupabaseAuthRepository } from '../auth/SupabaseAuthRepository';
import { GoogleBooksCatalogRepository } from '../catalog/GoogleBooksCatalogRepository';
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

export const container = {
  authRepository,
  readingRepository,
  showcaseRepository,
  profileRepository,
  appVersionRepository,
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
} as const;

export type Container = typeof container;
