import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Book } from '../../domain/entities/Book';
import { theme } from '../theme/theme';
import { useReadingStore } from '../store/useReadingStore';
import { useShowcaseStore } from '../store/useShowcaseStore';
import { ReadButton } from '../components/ReadButton';
import { BookPickerModal } from '../components/BookPickerModal';
import { StatsCard } from '../components/StatsCard';
import { MonthCalendar } from '../components/MonthCalendar';

/** Tela de leitura: botão de marcar (segurar), estatísticas e calendário. */
export function HomeScreen() {
  const { markedDates, stats, loading, initialized, error, init, toggleToday, toggleDate } =
    useReadingStore();
  const showcaseBooks = useShowcaseStore((s) => s.books);
  const showcaseInitialized = useShowcaseStore((s) => s.initialized);
  const initShowcase = useShowcaseStore((s) => s.init);

  const [pickerVisible, setPickerVisible] = useState(false);

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (!showcaseInitialized) {
      initShowcase();
    }
  }, [showcaseInitialized, initShowcase]);

  useEffect(() => {
    if (initialized) {
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(slide, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }
  }, [initialized, fade, slide]);

  // Set para lookups O(1) no calendário, memoizado enquanto as datas não mudam.
  const markedSet = useMemo(() => new Set(markedDates), [markedDates]);

  const handleConfirm = () => {
    if (stats.readToday) {
      // Desfazer não precisa perguntar qual livro foi lido.
      toggleToday();
      return;
    }
    if (showcaseBooks.length === 0) {
      toggleToday();
      return;
    }
    setPickerVisible(true);
  };

  const handleSelectBook = (book: Book | null) => {
    setPickerVisible(false);
    toggleToday(book ? { bookId: book.id, bookTitle: book.title } : undefined);
  };

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
        <Animated.View
          style={{ opacity: fade, transform: [{ translateY: slide }], gap: theme.spacing.lg }}
        >
          <View style={styles.headerBlock}>
            <Text style={styles.greeting}>Track Read</Text>
            <Text style={styles.subtitle}>
              {stats.currentStreak > 0
                ? `🔥 ${stats.currentStreak} ${
                    stats.currentStreak === 1 ? 'dia seguido' : 'dias seguidos'
                  }`
                : 'Comece sua sequência hoje 📖'}
            </Text>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <StatsCard stats={stats} />

          <MonthCalendar markedDates={markedSet} onToggleDate={toggleDate} />

          <Text style={styles.hint}>
            Toque em qualquer dia do calendário para ajustar leituras passadas.
          </Text>
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        <ReadButton readToday={stats.readToday} loading={loading} onConfirm={handleConfirm} />
      </View>

      <BookPickerModal
        visible={pickerVisible}
        books={showcaseBooks}
        onSelect={handleSelectBook}
        onClose={() => setPickerVisible(false)}
      />
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
    paddingBottom: theme.spacing.xl,
  },
  headerBlock: {
    gap: theme.spacing.xs,
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
  footer: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
});
