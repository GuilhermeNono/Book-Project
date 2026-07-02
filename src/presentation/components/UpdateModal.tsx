import { Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useUpdateStore } from '../store/useUpdateStore';
import { theme } from '../theme/theme';

/**
 * Pop-up dispensável avisando que existe uma nova versão do app. Aparece
 * sobre a tela de login ou as abas principais, o que estiver montado.
 */
export function UpdateModal() {
  const { available, dismissed, latestVersion, releaseNotes, apkUrl, dismiss } = useUpdateStore();

  if (!available || dismissed || !apkUrl) {
    return null;
  }

  const handleDownload = () => {
    Linking.openURL(apkUrl);
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={dismiss}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Nova versão disponível</Text>
          {latestVersion ? <Text style={styles.version}>Versão {latestVersion}</Text> : null}
          {releaseNotes ? <Text style={styles.notes}>{releaseNotes}</Text> : null}
          <View style={styles.actions}>
            <Pressable style={styles.secondaryButton} onPress={dismiss}>
              <Text style={styles.secondaryLabel}>Agora não</Text>
            </Pressable>
            <Pressable style={styles.primaryButton} onPress={handleDownload}>
              <Text style={styles.primaryLabel}>Baixar atualização</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.font.heading,
    fontWeight: '800',
  },
  version: {
    color: theme.colors.primary,
    fontSize: theme.font.body,
    fontWeight: '600',
  },
  notes: {
    color: theme.colors.textMuted,
    fontSize: theme.font.caption,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  secondaryButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  secondaryLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.font.body,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
  },
  primaryLabel: {
    color: theme.colors.background,
    fontSize: theme.font.body,
    fontWeight: '700',
  },
});
