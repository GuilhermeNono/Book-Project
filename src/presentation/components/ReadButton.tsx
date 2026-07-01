import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '../theme/theme';

interface ReadButtonProps {
  readToday: boolean;
  loading: boolean;
  onPress: () => void;
}

/**
 * Botão principal do app: registra (ou desfaz) a leitura de hoje.
 * O rótulo e a aparência refletem o estado atual do dia.
 */
export function ReadButton({ readToday, loading, onPress }: ReadButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ checked: readToday, busy: loading }}
      accessibilityLabel={
        readToday ? 'Desfazer leitura de hoje' : 'Marcar leitura de hoje'
      }
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.button,
        readToday ? styles.buttonDone : styles.buttonPending,
        pressed && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors.text} />
      ) : (
        <View style={styles.content}>
          <Text style={styles.icon}>{readToday ? '✓' : '＋'}</Text>
          <Text style={styles.label}>
            {readToday ? 'Lido hoje' : 'Marcar leitura de hoje'}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 72,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    borderWidth: 1,
  },
  buttonPending: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  buttonDone: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.success,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  icon: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  label: {
    color: theme.colors.text,
    fontSize: theme.font.heading,
    fontWeight: '700',
  },
});
