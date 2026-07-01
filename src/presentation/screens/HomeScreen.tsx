import { useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { theme } from '../theme/theme';
import { useReadingStore } from '../store/useReadingStore';
import { useAuthStore } from '../store/useAuthStore';
import { ReadButton } from '../components/ReadButton';
import { StatsCard } from '../components/StatsCard';
import { MonthCalendar } from '../components/MonthCalendar';

/** Tela única do app: botão de leitura, estatísticas e calendário. */
export function HomeScreen() {
  const {
    markedDates,
    stats,
    loading,
    initialized,
    error,
    init,
    toggleToday,
    toggleDate,
  } = useReadingStore();
  const { session, signOut } = useAuthStore();

  useEffect(() => {
    init();
  }, [init]);

  // Set para lookups O(1) no calendário, memoizado enquanto as datas não mudam.
  const markedSet = useMemo(() => new Set(markedDates), [markedDates]);

  if (!initialized) {
    return (
      <SafeAreaView style={[styles.safe, styles.centered]}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.headerBlock}>
            <Text style={styles.greeting}>Meu Diário de Leitura</Text>
            <Text style={styles.subtitle}>
              {stats.currentStreak > 0
                ? `🔥 ${stats.currentStreak} ${
                    stats.currentStreak === 1 ? 'dia seguido' : 'dias seguidos'
                  }`
                : 'Comece sua sequência hoje 📖'}
            </Text>
          </View>
          <Pressable onPress={signOut} hitSlop={8}>
            <Text style={styles.signOut}>Sair</Text>
          </Pressable>
        </View>

        {session?.email ? <Text style={styles.emailHint}>{session.email}</Text> : null}

        <ReadButton readToday={stats.readToday} loading={loading} onPress={toggleToday} />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <StatsCard stats={stats} />

        <MonthCalendar markedDates={markedSet} onToggleDate={toggleDate} />

        <Text style={styles.hint}>
          Toque em qualquer dia do calendário para ajustar leituras passadas.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerBlock: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  signOut: {
    color: theme.colors.textMuted,
    fontSize: theme.font.body,
    fontWeight: '600',
  },
  emailHint: {
    color: theme.colors.textMuted,
    fontSize: theme.font.caption,
    marginTop: -theme.spacing.md,
  },
  greeting: {
    color: theme.colors.text,
    fontSize: theme.font.title,
    fontWeight: '800',
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: theme.font.body,
  },
  error: {
    color: theme.colors.accent,
    fontSize: theme.font.caption,
  },
  hint: {
    color: theme.colors.textMuted,
    fontSize: theme.font.caption,
    textAlign: 'center',
  },
});
