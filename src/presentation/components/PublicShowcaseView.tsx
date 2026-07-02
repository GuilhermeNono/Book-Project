import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../theme/theme';
import { useCommunityStore } from '../store/useCommunityStore';
import { ShowcaseGrid } from './ShowcaseGrid';

/** Modal somente-leitura com a vitrine pública de outro usuário. */
export function PublicShowcaseView() {
  const { viewingShowcaseOf, viewingShowcaseBooks, loadingShowcase, closePublicShowcase } =
    useCommunityStore();

  const visible = viewingShowcaseOf !== null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={closePublicShowcase}>
      <View style={styles.safe}>
        <View style={styles.header}>
          {viewingShowcaseOf?.avatarUrl ? (
            <Image source={{ uri: viewingShowcaseOf.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={20} color={theme.colors.textMuted} />
            </View>
          )}
          <Text style={styles.title} numberOfLines={1}>
            {viewingShowcaseOf?.displayName ?? 'Vitrine'}
          </Text>
          <Pressable onPress={closePublicShowcase} hitSlop={8} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </Pressable>
        </View>

        {loadingShowcase ? (
          <ActivityIndicator color={theme.colors.primary} style={styles.loading} />
        ) : (
          <ScrollView contentContainerStyle={styles.content}>
            <ShowcaseGrid books={viewingShowcaseBooks} emptyText="Este usuário ainda não tem livros na vitrine." />
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surfaceMuted,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    color: theme.colors.text,
    fontSize: theme.font.heading,
    fontWeight: '700',
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  loading: {
    marginTop: theme.spacing.lg,
  },
  content: {
    padding: theme.spacing.lg,
  },
});
