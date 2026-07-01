import { useEffect } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { theme } from './src/presentation/theme/theme';
import { useAuthStore } from './src/presentation/store/useAuthStore';
import { LoginScreen } from './src/presentation/screens/LoginScreen';
import { HomeScreen } from './src/presentation/screens/HomeScreen';

/**
 * Entry point da aplicação. Decide entre tela de login e a tela principal com
 * base na sessão do Supabase; toda a lógica de negócio vive em `src/`.
 */
export default function App() {
  const { session, initialized, init } = useAuthStore();

  useEffect(() => {
    init();
  }, [init]);

  if (!initialized) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      {session ? <HomeScreen /> : <LoginScreen />}
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
