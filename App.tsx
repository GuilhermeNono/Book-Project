import { useCallback, useEffect } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

import { theme } from './src/presentation/theme/theme';
import { useAuthStore } from './src/presentation/store/useAuthStore';
import { LoginScreen } from './src/presentation/screens/LoginScreen';
import { HomeScreen } from './src/presentation/screens/HomeScreen';

// Mantém a splash nativa visível até sabermos se há sessão — evita o "flash"
// de uma tela em branco entre a splash e o primeiro conteúdo real.
SplashScreen.preventAutoHideAsync().catch(() => {});

/**
 * Entry point da aplicação. Decide entre tela de login e a tela principal com
 * base na sessão do Supabase; toda a lógica de negócio vive em `src/`.
 */
export default function App() {
  const { session, initialized, init } = useAuthStore();

  useEffect(() => {
    init();
  }, [init]);

  const onLayout = useCallback(() => {
    if (initialized) {
      SplashScreen.hideAsync();
    }
  }, [initialized]);

  if (!initialized) {
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }} onLayout={onLayout}>
      <StatusBar style="light" />
      {session ? <HomeScreen /> : <LoginScreen />}
    </View>
  );
}
