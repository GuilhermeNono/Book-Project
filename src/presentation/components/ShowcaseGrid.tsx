import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Book } from '../../domain/entities/Book';
import { theme } from '../theme/theme';

interface ShowcaseGridProps {
  books: Book[];
  /** Se omitido, a grade fica somente leitura (sem badge de remover) — usado na vitrine pública de outros usuários. */
  onRemove?: (bookId: string) => void;
  emptyText?: string;
}

/**
 * Grade de capas reutilizável, extraída de `ShowcaseScreen`. Usada tanto pela
 * vitrine do próprio usuário (editável, com `onRemove`) quanto pela vitrine
 * pública de outros usuários (somente leitura, sem `onRemove`).
 */
export function ShowcaseGrid({ books, onRemove, emptyText }: ShowcaseGridProps) {
  if (books.length === 0) {
    return emptyText ? <Text style={styles.emptyHint}>{emptyText}</Text> : null;
  }

  return (
    <View style={styles.grid}>
      {books.map((book) => (
        <ShowcaseGridItem key={book.id} book={book} onRemove={onRemove} />
      ))}
    </View>
  );
}

function ShowcaseGridItem({ book, onRemove }: { book: Book; onRemove?: (bookId: string) => void }) {
  return (
    <View style={styles.gridItem}>
      {book.coverUrl ? (
        <Image source={{ uri: book.coverUrl }} style={styles.gridCover} />
      ) : (
        <View style={[styles.gridCover, styles.coverPlaceholder]}>
          <Text style={styles.coverPlaceholderText}>📖</Text>
        </View>
      )}
      {onRemove ? (
        <Pressable
          onPress={() => onRemove(book.id)}
          hitSlop={8}
          style={styles.removeBadge}
          accessibilityLabel={`Remover ${book.title} da vitrine`}
        >
          <Text style={styles.removeBadgeText}>×</Text>
        </Pressable>
      ) : null}
      <Text style={styles.gridTitle} numberOfLines={2}>
        {book.title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyHint: {
    color: theme.colors.textMuted,
    fontSize: theme.font.body,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  gridItem: {
    width: '30%',
    gap: theme.spacing.xs,
  },
  gridCover: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surfaceMuted,
  },
  coverPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverPlaceholderText: {
    fontSize: 20,
  },
  gridTitle: {
    color: theme.colors.text,
    fontSize: theme.font.caption,
    fontWeight: '600',
  },
  removeBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBadgeText: {
    color: theme.colors.text,
    fontSize: 16,
    lineHeight: 16,
    fontWeight: '700',
  },
});
