import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Book } from '../../domain/entities/Book';
import { theme } from '../theme/theme';
import { useShowcaseStore } from '../store/useShowcaseStore';

const SEARCH_DEBOUNCE_MS = 400;

/** Vitrine: livros que o usuário possui, buscados na Google Books API. */
export function ShowcaseScreen() {
  const {
    books,
    searchResults,
    searching,
    loading,
    initialized,
    error,
    init,
    search,
    clearSearch,
    addBook,
    removeBook,
  } = useShowcaseStore();

  const [query, setQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ownedIds = new Set(books.map((b) => b.id));

  useEffect(() => {
    if (!initialized) {
      init();
    }
  }, [initialized, init]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleChangeQuery = (text: string) => {
    setQuery(text);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (!text.trim()) {
      clearSearch();
      return;
    }
    debounceRef.current = setTimeout(() => search(text), SEARCH_DEBOUNCE_MS);
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
      <View style={styles.header}>
        <Text style={styles.title}>Vitrine</Text>
        <TextInput
          value={query}
          onChangeText={handleChangeQuery}
          placeholder="Buscar livro por título ou autor..."
          placeholderTextColor={theme.colors.textMuted}
          style={styles.input}
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {query.trim().length > 0 ? (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            searching ? (
              <ActivityIndicator color={theme.colors.primary} style={styles.listLoading} />
            ) : (
              <Text style={styles.emptyHint}>Nenhum resultado ainda.</Text>
            )
          }
          renderItem={({ item }) => (
            <SearchResultRow item={item} owned={ownedIds.has(item.id)} onAdd={addBook} />
          )}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          <Text style={styles.sectionTitle}>Minha Vitrine</Text>
          {loading ? (
            <ActivityIndicator color={theme.colors.primary} />
          ) : books.length === 0 ? (
            <Text style={styles.emptyHint}>
              Busque um livro acima e adicione à sua vitrine.
            </Text>
          ) : (
            <View style={styles.grid}>
              {books.map((book) => (
                <ShowcaseGridItem key={book.id} book={book} onRemove={removeBook} />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function SearchResultRow({
  item,
  owned,
  onAdd,
}: {
  item: Book;
  owned: boolean;
  onAdd: (book: Book) => void;
}) {
  return (
    <View style={styles.row}>
      {item.coverUrl ? (
        <Image source={{ uri: item.coverUrl }} style={styles.cover} />
      ) : (
        <View style={[styles.cover, styles.coverPlaceholder]}>
          <Text style={styles.coverPlaceholderText}>📖</Text>
        </View>
      )}
      <View style={styles.rowText}>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {item.title}
        </Text>
        {item.authors.length > 0 ? (
          <Text style={styles.rowAuthors} numberOfLines={1}>
            {item.authors.join(', ')}
          </Text>
        ) : null}
      </View>
      <Pressable
        disabled={owned}
        onPress={() => onAdd(item)}
        style={({ pressed }) => [
          styles.addButton,
          owned && styles.addButtonDisabled,
          pressed && !owned && styles.pressed,
        ]}
      >
        <Text style={styles.addButtonText}>{owned ? 'Adicionado' : 'Adicionar'}</Text>
      </Pressable>
    </View>
  );
}

function ShowcaseGridItem({
  book,
  onRemove,
}: {
  book: Book;
  onRemove: (bookId: string) => void;
}) {
  return (
    <View style={styles.gridItem}>
      {book.coverUrl ? (
        <Image source={{ uri: book.coverUrl }} style={styles.gridCover} />
      ) : (
        <View style={[styles.gridCover, styles.coverPlaceholder]}>
          <Text style={styles.coverPlaceholderText}>📖</Text>
        </View>
      )}
      <Pressable
        onPress={() => onRemove(book.id)}
        hitSlop={8}
        style={styles.removeBadge}
        accessibilityLabel={`Remover ${book.title} da vitrine`}
      >
        <Text style={styles.removeBadgeText}>×</Text>
      </Pressable>
      <Text style={styles.gridTitle} numberOfLines={2}>
        {book.title}
      </Text>
    </View>
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
  header: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.font.title,
    fontWeight: '800',
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    color: theme.colors.text,
    fontSize: theme.font.body,
  },
  error: {
    color: theme.colors.accent,
    fontSize: theme.font.caption,
    paddingHorizontal: theme.spacing.lg,
  },
  list: {
    padding: theme.spacing.lg,
    paddingTop: 0,
    gap: theme.spacing.sm,
  },
  listLoading: {
    marginTop: theme.spacing.lg,
  },
  emptyHint: {
    color: theme.colors.textMuted,
    fontSize: theme.font.body,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: theme.font.heading,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.sm,
  },
  cover: {
    width: 44,
    height: 64,
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
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    color: theme.colors.text,
    fontSize: theme.font.body,
    fontWeight: '700',
  },
  rowAuthors: {
    color: theme.colors.textMuted,
    fontSize: theme.font.caption,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  addButtonDisabled: {
    backgroundColor: theme.colors.surfaceMuted,
  },
  pressed: {
    opacity: 0.85,
  },
  addButtonText: {
    color: theme.colors.text,
    fontSize: theme.font.caption,
    fontWeight: '700',
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
