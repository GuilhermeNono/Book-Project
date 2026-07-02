import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Message } from '../../domain/entities/Message';
import { PublicProfile } from '../../domain/entities/PublicProfile';
import { theme } from '../theme/theme';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';

interface ChatModalProps {
  friend: PublicProfile | null;
  onClose: () => void;
}

/** Modal de chat de texto com um amigo, com entrega em tempo real via Supabase Realtime. */
export function ChatModal({ friend, onClose }: ChatModalProps) {
  const currentUserId = useAuthStore((s) => s.session?.userId);
  const { messages, loading, sending, error, openConversation, closeConversation, send } = useChatStore();
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (friend) {
      openConversation(friend.userId);
    }
    return () => {
      closeConversation();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [friend?.userId]);

  const handleSend = () => {
    if (!draft.trim()) {
      return;
    }
    send(draft);
    setDraft('');
  };

  return (
    <Modal visible={friend !== null} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {friend?.displayName ?? 'Conversa'}
          </Text>
          <Pressable onPress={onClose} hitSlop={8} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </Pressable>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {loading ? (
          <ActivityIndicator color={theme.colors.primary} style={styles.loading} />
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => <Bubble message={item} isMine={item.senderId === currentUserId} />}
          />
        )}

        <View style={styles.composer}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Escreva uma mensagem..."
            placeholderTextColor={theme.colors.textMuted}
            style={styles.input}
            multiline
          />
          <Pressable
            disabled={sending || !draft.trim()}
            onPress={handleSend}
            style={({ pressed }) => [
              styles.sendButton,
              (sending || !draft.trim()) && styles.sendButtonDisabled,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="send" size={18} color={theme.colors.text} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Bubble({ message, isMine }: { message: Message; isMine: boolean }) {
  return (
    <View style={[styles.bubbleRow, isMine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
      <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
        <Text style={styles.bubbleText}>{message.body}</Text>
      </View>
    </View>
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
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
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
  error: {
    color: theme.colors.accent,
    fontSize: theme.font.caption,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
  },
  loading: {
    marginTop: theme.spacing.lg,
  },
  list: {
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  bubbleRow: {
    flexDirection: 'row',
  },
  bubbleRowMine: {
    justifyContent: 'flex-end',
  },
  bubbleRowTheirs: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  bubbleMine: {
    backgroundColor: theme.colors.primary,
  },
  bubbleTheirs: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  bubbleText: {
    color: theme.colors.text,
    fontSize: theme.font.body,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    color: theme.colors.text,
    fontSize: theme.font.body,
    maxHeight: 120,
  },
  sendButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.surfaceMuted,
  },
  pressed: {
    opacity: 0.85,
  },
});
