import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { theme } from '../theme/theme';
import { useAuthStore } from '../store/useAuthStore';

type Mode = 'signIn' | 'signUp';

/** Tela de autenticação: alterna entre entrar e criar conta. */
export function LoginScreen() {
  const { loading, error, signIn, signUp, clearError } = useAuthStore();
  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const isSignUp = mode === 'signUp';
  const canSubmit = email.trim().length > 3 && password.length >= 6 && !loading;

  const handleSubmit = () => {
    if (!canSubmit) {
      return;
    }
    if (isSignUp) {
      signUp(email.trim(), password);
    } else {
      signIn(email.trim(), password);
    }
  };

  const toggleMode = () => {
    clearError();
    setMode((current) => (current === 'signIn' ? 'signUp' : 'signIn'));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Track Read</Text>
          <Text style={styles.subtitle}>
            {isSignUp ? 'Crie sua conta para começar' : 'Entre para continuar'}
          </Text>

          <View style={styles.form}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={theme.colors.textMuted}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              style={styles.input}
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Senha (mín. 6 caracteres)"
              placeholderTextColor={theme.colors.textMuted}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
              style={styles.input}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              onPress={handleSubmit}
              disabled={!canSubmit}
              style={({ pressed }) => [
                styles.submitButton,
                !canSubmit && styles.submitButtonDisabled,
                pressed && canSubmit && styles.pressed,
              ]}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.text} />
              ) : (
                <Text style={styles.submitLabel}>
                  {isSignUp ? 'Criar conta' : 'Entrar'}
                </Text>
              )}
            </Pressable>

            <Pressable onPress={toggleMode} hitSlop={8} style={styles.switchButton}>
              <Text style={styles.switchLabel}>
                {isSignUp
                  ? 'Já tem uma conta? Entrar'
                  : 'Ainda não tem conta? Criar conta'}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.font.title,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: theme.font.body,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  form: {
    gap: theme.spacing.md,
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
    textAlign: 'center',
  },
  submitButton: {
    minHeight: 56,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
  },
  submitLabel: {
    color: theme.colors.text,
    fontSize: theme.font.heading,
    fontWeight: '700',
  },
  switchButton: {
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  switchLabel: {
    color: theme.colors.primary,
    fontSize: theme.font.body,
    fontWeight: '600',
  },
});
