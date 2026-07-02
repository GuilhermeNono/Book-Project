import { AppVersion } from '../entities/AppVersion';

/** Porta do domínio para consultar a versão mais recente publicada do app. */
export interface IAppVersionRepository {
  /** A versão mais recente publicada, ou `null` se nenhuma tiver sido registrada ainda. */
  getLatest(): Promise<AppVersion | null>;
}
