import Constants from 'expo-constants';
import { create } from 'zustand';

import { container } from '../../infrastructure/di/container';

interface UpdateState {
  checked: boolean;
  available: boolean;
  latestVersion: string | null;
  apkUrl: string | null;
  releaseNotes: string | null;
  dismissed: boolean;

  /** Consulta a versão mais recente publicada e compara com a instalada. */
  check: () => Promise<void>;
  /** Fecha o pop-up sem atualizar (dispensável — volta a aparecer em uma próxima sessão). */
  dismiss: () => void;
}

/**
 * Store de apresentação para o aviso de nova versão do app. Como o app não é
 * distribuído pela Play Store, não há atualização automática do sistema —
 * esta store expõe o estado para o `UpdateModal` oferecer o download do APK.
 */
export const useUpdateStore = create<UpdateState>((set) => ({
  checked: false,
  available: false,
  latestVersion: null,
  apkUrl: null,
  releaseNotes: null,
  dismissed: false,

  check: async () => {
    try {
      const currentVersion = Constants.expoConfig?.version ?? '0.0.0';
      const info = await container.checkForUpdate.execute(currentVersion);
      set({
        checked: true,
        available: info.available,
        latestVersion: info.latestVersion,
        apkUrl: info.apkUrl,
        releaseNotes: info.releaseNotes,
      });
    } catch {
      // Checagem de update nunca deve travar o app — falha silenciosamente.
      set({ checked: true });
    }
  },

  dismiss: () => set({ dismissed: true }),
}));
