import { Profile } from '../entities/Profile';

/** Porta do domínio para o perfil do usuário (nome de exibição, foto). */
export interface IProfileRepository {
  load(): Promise<Profile>;
  /** Envia a imagem local e retorna a URL pública salva. */
  updateAvatar(localUri: string): Promise<string>;
  updateDisplayName(name: string): Promise<void>;
}
