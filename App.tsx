import { useCallback, useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

import { theme } from './src/presentation/theme/theme';
import { useAuthStore } from './src/presentation/store/useAuthStore';
import { LoginScreen } from './src/presentation/screens/LoginScreen';
import { RootTabs } from './src/presentation/navigation/RootTabs';

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
      </View>
    </SafeAreaProvider>
  );
}
