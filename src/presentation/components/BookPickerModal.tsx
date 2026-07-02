import { useEffect, useState } from 'react';
import { FlatList, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Book } from '../../domain/entities/Book';
import { theme } from '../theme/theme';

interface BookPickerModalProps {
  visible: boolean;
  books: Book[];
  /** Chamado com os livros marcados quando o usuário toca em "Confirmar". */
  onConfirm: (books: Book[]) => void;
  /** Chamado quando o usuário indica que não leu nenhum livro específico. */
  onSkip: () => void;
  onClose: () => void;
}

/** Modal exibido ao marcar a leitura de hoje: quais livros da vitrine foram lidos (seleção múltipla). */
export function BookPickerModal({ visible, books, onConfirm, onSkip, onClose }: BookPickerModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Reseta a seleção sempre que o modal é reaberto.
  useEffect(() => {
    if (visible) {
      setSelected(new Set());
    }
  }, [visible]);

  const toggleSelected = (bookId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(bookId)) {
        next.delete(bookId);
      } else {
        next.add(bookId);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    onConfirm(books.filter((book) => selected.has(book.id)));
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Quais livros você leu hoje?</Text>

          <FlatList
            data={books}
            keyExtractor={(item) => item.id}
            style={styles.list}
            renderItem={({ item }) => {
              const isSelected = selected.has(item.id);
              return (
                <Pressable
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                  onPress={() => toggleSelected(item.id)}
                >
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
                  <Ionicons
                    name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                    size={24}
                    color={isSelected ? theme.colors.primary : theme.colors.textMuted}
                  />
                </Pressable>
              );
            }}
          />

          <Pressable
            style={({ pressed }) => [styles.noBookButton, pressed && styles.rowPressed]}
            onPress={onSkip}
          >
            <Text style={styles.noBookText}>Sem livro específico</Text>
          </Pressable>

          <Pressable
            disabled={selected.size === 0}
            style={({ pressed }) => [
              styles.confirmButton,
              selected.size === 0 && styles.confirmButtonDisabled,
              pressed && selected.size > 0 && styles.rowPressed,
            ]}
            onPress={handleConfirm}
          >
            <Text style={styles.confirmText}>
              {selected.size > 0 ? `Confirmar (${selected.size})` : 'Confirmar'}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    maxHeight: '75%',
    gap: theme.spacing.md,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.font.heading,
    fontWeight: '700',
  },
  list: {
    flexGrow: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  rowPressed: {
    opacity: 0.7,
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
  noBookButton: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.md,
    alignItems: 'center',
  },
  noBookText: {
    color: theme.colors.primary,
    fontSize: theme.font.body,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: theme.colors.surfaceMuted,
  },
  confirmText: {
    color: theme.colors.text,
    fontSize: theme.font.body,
    fontWeight: '700',
  },
});
