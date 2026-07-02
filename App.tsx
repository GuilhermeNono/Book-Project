import { useCallback, useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

import { theme } from './src/presentation/theme/theme';
import { useAuthStore } from './src/presentation/store/useAuthStore';
import { useFriendsStore } from './src/presentation/store/useFriendsStore';
import { useUpdateStore } from './src/presentation/store/useUpdateStore';
import { LoginScreen } from './src/presentation/screens/LoginScreen';
import { RootTabs } from './src/presentation/navigation/RootTabs';
import { UpdateModal } from './src/presentation/components/UpdateModal';

// Mantém a splash nativa visível até sabermos se há sessão — evita o "flash"
// de uma tela em branco entre a splash e o primeiro conteúdo real.
SplashScreen.preventAutoHideAsync().catch(() => {});

/**
 * Entry point da aplicação. Decide entre tela de login e a navegação
 * principal com base na sessão do Supabase; toda a lógica de negócio vive em
 * `src/`.
 */
export default function App() {
  const { session, initialized, init } = useAuthStore();
  const checkForUpdate = useUpdateStore((s) => s.check);
  const fetchPendingCount = useFriendsStore((s) => s.fetchPendingCount);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    checkForUpdate();
  }, [checkForUpdate]);

  useEffect(() => {
    if (session) {
      fetchPendingCount();
    }
  }, [session, fetchPendingCount]);

  const onLayout = useCallback(() => {
    if (initialized) {
      SplashScreen.hideAsync();
    }
  }, [initialized]);

  if (!initialized) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: theme.colors.background }} onLayout={onLayout}>
        <StatusBar style="light" />
        {session ? (
          <NavigationContainer>
            <RootTabs />
          </NavigationContainer>
        ) : (
          <LoginScreen />
        )}
        <UpdateModal />
      </View>
    </SafeAreaProvider>
  );
}
