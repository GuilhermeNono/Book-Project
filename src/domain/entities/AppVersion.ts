/** Metadados da versão mais recente do app publicada pelo pipeline de build. */
export interface AppVersion {
  version: string;
  apkUrl: string;
  releaseNotes: string | null;
}
