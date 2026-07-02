import { useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { theme } from '../theme/theme';
import { useAuthStore } from '../store/useAuthStore';
import { useProfileStore } from '../store/useProfileStore';
import { useReadingStore } from '../store/useReadingStore';
import { useShowcaseStore } from '../store/useShowcaseStore';
import { StatsCard } from '../components/StatsCard';

/** Perfil: foto, nome de exibição, email, estatísticas, vitrine e encerrar sessão. */
export function ProfileScreen() {
  const { session, signOut } = useAuthStore();
  const { profile, loading, initialized, error, init, updateAvatar, updateDisplayName } =
    useProfileStore();
  const stats = useReadingStore((s) => s.stats);
  const mostRecentBookIds = useReadingStore((s) => s.mostRecentBookIds);
  const readingInitialized = useReadingStore((s) => s.initialized);
  const initReading = useReadingStore((s) => s.init);
  const showcaseBooks = useShowcaseStore((s) => s.books);
  const showcaseInitialized = useShowcaseStore((s) => s.initialized);
  const initShowcase = useShowcaseStore((s) => s.init);

  const [name, setName] = useState('');
  const [editingName, setEditingName] = useState(false);

  useEffect(() => {
    if (!initialized) {
      init();
    }
  }, [initialized, init]);

  useEffect(() => {
    if (!readingInitialized) {
      initReading();
    }
  }, [readingInitialized, initReading]);

  useEffect(() => {
    if (!showcaseInitialized) {
      initShowcase();
    }
  }, [showcaseInitialized, initShowcase]);

  useEffect(() => {
    setName(profile?.displayName ?? '');
  }, [profile?.displayName]);

  const handlePickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permissão necessária',
        'Autorize o acesso às fotos para escolher uma imagem de perfil.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      updateAvatar(result.assets[0].uri);
    }
  };

  const handleSaveName = () => {
    setEditingName(false);
    const trimmed = name.trim();
    if (trimmed && trimmed !== profile?.displayName) {
      updateDisplayName(trimmed);
    }
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
        <Text style={styles.title}>Perfil</Text>

        <Pressable onPress={handlePickAvatar} style={styles.avatarWrap}>
          {profile?.avatarUrl ? (
            <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarPlaceholderText}>
                {(session?.email ?? '?').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {loading ? (
            <View style={styles.avatarOverlay}>
              <ActivityIndicator color={theme.colors.text} />
            </View>
          ) : null}
          <Text style={styles.avatarHint}>Toque para trocar a foto</Text>
        </Pressable>

        {editingName ? (
          <TextInput
            value={name}
            onChangeText={setName}
            onBlur={handleSaveName}
            onSubmitEditing={handleSaveName}
            autoFocus
            placeholder="Seu nome"
            placeholderTextColor={theme.colors.textMuted}
            style={styles.nameInput}
          />
        ) : (
          <Pressable onPress={() => setEditingName(true)}>
            <Text style={styles.name}>{profile?.displayName || 'Adicionar nome'}</Text>
          </Pressable>
        )}

        <Text style={styles.email}>{session?.email}</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Suas estatísticas</Text>
          <StatsCard stats={stats} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sua vitrine</Text>
          {showcaseBooks.length === 0 ? (
            <Text style={styles.emptyHint}>Você ainda não adicionou livros à vitrine.</Text>
          ) : (
            showcaseBooks.map((book) => (
              <View key={book.id} style={styles.showcaseRow}>
                {book.coverUrl ? (
                  <Image source={{ uri: book.coverUrl }} style={styles.showcaseCover} />
                ) : (
                  <View style={[styles.showcaseCover, styles.showcaseCoverPlaceholder]}>
                    <Text style={styles.showcaseCoverPlaceholderText}>📖</Text>
                  </View>
                )}
                <View style={styles.showcaseRowText}>
                  <Text style={styles.showcaseRowTitle} numberOfLines={2}>
                    {book.title}
                  </Text>
                  {book.authors.length > 0 ? (
                    <Text style={styles.showcaseRowAuthors} numberOfLines={1}>
                      {book.authors.join(', ')}
                    </Text>
                  ) : null}
                  {mostRecentBookIds.includes(book.id) ? (
                    <View style={styles.recentBadge}>
                      <Text style={styles.recentBadgeText}>Lido mais recentemente</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ))
          )}
        </View>

        <Pressable
          onPress={signOut}
          style={({ pressed }) => [styles.signOutButton, pressed && styles.pressed]}
        >
          <Text style={styles.signOutText}>Sair</Text>
        </Pressable>
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
    flexGrow: 1,
    padding: theme.spacing.lg,
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  section: {
    width: '100%',
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: theme.font.heading,
    fontWeight: '700',
    alignSelf: 'flex-start',
  },
  emptyHint: {
    color: theme.colors.textMuted,
    fontSize: theme.font.body,
  },
  showcaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.sm,
  },
  showcaseCover: {
    width: 44,
    height: 64,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surfaceMuted,
  },
  showcaseCoverPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  showcaseCoverPlaceholderText: {
    fontSize: 20,
  },
  showcaseRowText: {
    flex: 1,
    gap: 2,
  },
  showcaseRowTitle: {
    color: theme.colors.text,
    fontSize: theme.font.body,
    fontWeight: '700',
  },
  showcaseRowAuthors: {
    color: theme.colors.textMuted,
    fontSize: theme.font.caption,
  },
  recentBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primaryMuted,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    marginTop: theme.spacing.xs,
  },
  recentBadgeText: {
    color: theme.colors.accent,
    fontSize: theme.font.caption,
    fontWeight: '700',
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.font.title,
    fontWeight: '800',
    alignSelf: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  avatarWrap: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surfaceMuted,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    color: theme.colors.text,
    fontSize: 40,
    fontWeight: '800',
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    width: 112,
    height: 112,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHint: {
    color: theme.colors.textMuted,
    fontSize: theme.font.caption,
  },
  name: {
    color: theme.colors.text,
    fontSize: theme.font.heading,
    fontWeight: '700',
  },
  nameInput: {
    color: theme.colors.text,
    fontSize: theme.font.heading,
    fontWeight: '700',
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    minWidth: 160,
  },
  email: {
    color: theme.colors.textMuted,
    fontSize: theme.font.body,
  },
  error: {
    color: theme.colors.accent,
    fontSize: theme.font.caption,
  },
  signOutButton: {
    marginTop: 'auto',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pressed: {
    opacity: 0.85,
  },
  signOutText: {
    color: theme.colors.textMuted,
    fontSize: theme.font.body,
    fontWeight: '700',
  },
});
