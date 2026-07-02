import { IAppVersionRepository } from '../../domain/repositories/IAppVersionRepository';
import { VersionComparator } from '../../domain/services/VersionComparator';

export interface UpdateInfo {
  available: boolean;
  latestVersion: string | null;
  apkUrl: string | null;
  releaseNotes: string | null;
}

const NO_UPDATE: UpdateInfo = {
  available: false,
  latestVersion: null,
  apkUrl: null,
  releaseNotes: null,
};

/**
 * Caso de uso: verificar se existe uma versão mais nova do app publicada.
 *
 * Como o app não é distribuído pela Play Store, não há atualização automática
 * do sistema operacional — este é o mecanismo que avisa o usuário para baixar
 * o novo APK manualmente.
 */
export class CheckForUpdate {
  constructor(private readonly repository: IAppVersionRepository) {}

  /** @param currentVersion Versão instalada no dispositivo (ex.: `Constants.expoConfig.version`). */
  async execute(currentVersion: string): Promise<UpdateInfo> {
    const latest = await this.repository.getLatest();
    if (!latest) {
      return NO_UPDATE;
    }

    return {
      available: VersionComparator.isNewer(latest.version, currentVersion),
      latestVersion: latest.version,
      apkUrl: latest.apkUrl,
      releaseNotes: latest.releaseNotes,
    };
  }
}
