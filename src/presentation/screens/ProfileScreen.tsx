import { useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { theme } from '../theme/theme';
import { useAuthStore } from '../store/useAuthStore';
import { useProfileStore } from '../store/useProfileStore';

/** Perfil: foto, nome de exibição, email e encerrar sessão. */
export function ProfileScreen() {
  const { session, signOut } = useAuthStore();
  const { profile, loading, initialized, error, init, updateAvatar, updateDisplayName } =
    useProfileStore();

  const [name, setName] = useState('');
  const [editingName, setEditingName] = useState(false);

  useEffect(() => {
    if (!initialized) {
      init();
    }
  }, [initialized, init]);

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
      <View style={styles.content}>
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

        <Pressable
          onPress={signOut}
          style={({ pressed }) => [styles.signOutButton, pressed && styles.pressed]}
        >
          <Text style={styles.signOutText}>Sair</Text>
        </Pressable>
      </View>
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
    flex: 1,
    padding: theme.spacing.lg,
    alignItems: 'center',
    gap: theme.spacing.md,
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
