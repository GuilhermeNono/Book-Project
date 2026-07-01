import { useRef } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '../theme/theme';

const HOLD_DURATION_MS = 1500;

interface ReadButtonProps {
  readToday: boolean;
  loading: boolean;
  /** Chamado somente após segurar o botão por HOLD_DURATION_MS. */
  onConfirm: () => void;
}

/**
 * Botão principal do app: registra (ou desfaz) a leitura de hoje.
 *
 * A ação só dispara depois de segurar por 1.5s — evita toques acidentais. Uma
 * barra de progresso animada preenche durante o toque; soltar antes do tempo
 * cancela e mostra uma dica para segurar mais.
 */
export function ReadButton({ readToday, loading, onConfirm }: ReadButtonProps) {
  const fill = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const holdCompleted = useRef(false);

  const handlePressIn = () => {
    if (loading) {
      return;
    }
    holdCompleted.current = false;
    Animated.timing(fill, {
      toValue: 1,
      duration: HOLD_DURATION_MS,
      useNativeDriver: false,
    }).start();
  };

  const handlePressOut = () => {
    if (holdCompleted.current) {
      // Segurou até o fim: mantém a barra cheia por um instante e some.
      Animated.timing(fill, {
        toValue: 0,
        duration: 300,
        delay: 250,
        useNativeDriver: false,
      }).start();
      return;
    }
    // Soltou antes do tempo: cancela a barra.
    Animated.timing(fill, { toValue: 0, duration: 150, useNativeDriver: false }).start();
  };

  const handleLongPress = () => {
    if (loading) {
      return;
    }
    holdCompleted.current = true;
    onConfirm();
  };

  const handlePress = () => {
    if (holdCompleted.current || loading) {
      return;
    }
    // Toque rápido: avisa que é preciso segurar.
    Animated.sequence([
      Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const fillWidth = fill.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });
  const shakeTranslate = shake.interpolate({
    inputRange: [-1, 1],
    outputRange: [-6, 6],
  });

  return (
    <Animated.View style={{ transform: [{ translateX: shakeTranslate }] }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ checked: readToday, busy: loading }}
        accessibilityLabel={
          readToday ? 'Segure para desfazer a leitura de hoje' : 'Segure para marcar a leitura de hoje'
        }
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={handleLongPress}
        onPress={handlePress}
        delayLongPress={HOLD_DURATION_MS}
        disabled={loading}
        style={({ pressed }) => [
          styles.button,
          readToday ? styles.buttonDone : styles.buttonPending,
          pressed && styles.pressed,
        ]}
      >
        <Animated.View style={[styles.fill, { width: fillWidth }]} pointerEvents="none" />
        {loading ? (
          <ActivityIndicator color={theme.colors.text} />
        ) : (
          <View style={styles.content}>
            <Text style={styles.icon}>{readToday ? '✓' : '＋'}</Text>
            <Text style={styles.label}>
              {readToday ? 'Segure para desfazer' : 'Segure para marcar leitura'}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
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
    overflow: 'hidden',
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
    opacity: 0.92,
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.25)',
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
