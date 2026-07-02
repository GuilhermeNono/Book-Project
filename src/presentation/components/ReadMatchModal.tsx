import { useEffect } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { PublicProfile } from '../../domain/entities/PublicProfile';
import { MonthBreakdown, ReadMatchLeader } from '../../domain/services/ReadMatch';
import { theme } from '../theme/theme';
import { useAuthStore } from '../store/useAuthStore';
import { useReadMatchStore } from '../store/useReadMatchStore';

interface ReadMatchModalProps {
  friend: PublicProfile | null;
  onClose: () => void;
}

const LEADER_LABEL: Record<ReadMatchLeader, string> = {
  self: 'Você está na frente',
  friend: 'Seu amigo está na frente',
  tie: 'Empate',
};

/** Modal com a comparação "Read Match" (últimos 3 meses) entre o usuário atual e um amigo. */
export function ReadMatchModal({ friend, onClose }: ReadMatchModalProps) {
  const currentUserId = useAuthStore((s) => s.session?.userId);
  const { result, loading, error, compare, clear } = useReadMatchStore();

  useEffect(() => {
    if (friend && currentUserId) {
      compare(friend, currentUserId);
    }
    return () => clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [friend?.userId]);

  return (
    <Modal visible={friend !== null} animationType="slide" onRequestClose={onClose}>
      <View style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            Read Match com {friend?.displayName ?? 'amigo'}
          </Text>
          <Pressable onPress={onClose} hitSlop={8} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator color={theme.colors.primary} style={styles.loading} />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : result ? (
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.summary}>Últimos 3 meses de atividade de leitura</Text>

            <View style={styles.statsCard}>
              <StatRow label="Total de dias lidos" self={result.self.total} friend={result.friend.total} leader={result.leader.total} />
              <StatRow
                label="Sequência atual"
                self={result.self.currentStreak}
                friend={result.friend.currentStreak}
                leader={result.leader.currentStreak}
              />
              <StatRow
                label="Melhor sequência"
                self={result.self.longestStreak}
                friend={result.friend.longestStreak}
                leader={result.leader.longestStreak}
              />
            </View>

            <Text style={styles.sectionTitle}>Por mês</Text>
            <View style={styles.monthlyCard}>
              {result.monthly.map((month) => (
                <MonthRow key={month.month} month={month} />
              ))}
            </View>

            <View style={styles.extraCard}>
              <Text style={styles.extraText}>
                Dias em que os dois leram: <Text style={styles.extraValue}>{result.daysBothRead}</Text>
              </Text>
              <Text style={styles.extraText}>
                Livros em comum na vitrine:{' '}
                <Text style={styles.extraValue}>{result.showcaseOverlapCount}</Text>
              </Text>
            </View>
          </ScrollView>
        ) : null}
      </View>
    </Modal>
  );
}

function StatRow({
  label,
  self,
  friend,
  leader,
}: {
  label: string;
  self: number;
  friend: number;
  leader: ReadMatchLeader;
}) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.statValues}>
        <Text style={[styles.statValue, leader === 'self' && styles.statValueLeading]}>{self}</Text>
        <Text style={styles.statSeparator}>×</Text>
        <Text style={[styles.statValue, leader === 'friend' && styles.statValueLeading]}>{friend}</Text>
      </View>
      <Text style={styles.statLeader}>{LEADER_LABEL[leader]}</Text>
    </View>
  );
}

function MonthRow({ month }: { month: MonthBreakdown }) {
  const max = Math.max(month.selfCount, month.friendCount, 1);
  return (
    <View style={styles.monthRow}>
      <Text style={styles.monthLabel}>{month.month}</Text>
      <View style={styles.monthBars}>
        <View style={styles.monthBarTrack}>
          <View style={[styles.monthBarFill, styles.monthBarSelf, { width: `${(month.selfCount / max) * 100}%` }]} />
        </View>
        <Text style={styles.monthBarValue}>{month.selfCount}</Text>
      </View>
      <View style={styles.monthBars}>
        <View style={styles.monthBarTrack}>
          <View
            style={[styles.monthBarFill, styles.monthBarFriend, { width: `${(month.friendCount / max) * 100}%` }]}
          />
        </View>
        <Text style={styles.monthBarValue}>{month.friendCount}</Text>
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
  loading: {
    marginTop: theme.spacing.lg,
  },
  error: {
    color: theme.colors.accent,
    fontSize: theme.font.body,
    padding: theme.spacing.lg,
    textAlign: 'center',
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  summary: {
    color: theme.colors.textMuted,
    fontSize: theme.font.caption,
  },
  statsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  statRow: {
    gap: 2,
  },
  statLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.font.caption,
  },
  statValues: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: theme.spacing.sm,
  },
  statValue: {
    color: theme.colors.text,
    fontSize: theme.font.title,
    fontWeight: '800',
  },
  statValueLeading: {
    color: theme.colors.accent,
  },
  statSeparator: {
    color: theme.colors.textMuted,
    fontSize: theme.font.body,
  },
  statLeader: {
    color: theme.colors.textMuted,
    fontSize: theme.font.caption,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: theme.font.heading,
    fontWeight: '700',
  },
  monthlyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  monthRow: {
    gap: theme.spacing.xs,
  },
  monthLabel: {
    color: theme.colors.text,
    fontSize: theme.font.caption,
    fontWeight: '700',
  },
  monthBars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  monthBarTrack: {
    flex: 1,
    height: 8,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surfaceMuted,
    overflow: 'hidden',
  },
  monthBarFill: {
    height: '100%',
    borderRadius: theme.radius.pill,
  },
  monthBarSelf: {
    backgroundColor: theme.colors.primary,
  },
  monthBarFriend: {
    backgroundColor: theme.colors.accent,
  },
  monthBarValue: {
    width: 24,
    textAlign: 'right',
    color: theme.colors.textMuted,
    fontSize: theme.font.caption,
  },
  extraCard: {
    gap: theme.spacing.xs,
  },
  extraText: {
    color: theme.colors.textMuted,
    fontSize: theme.font.caption,
  },
  extraValue: {
    color: theme.colors.text,
    fontWeight: '700',
  },
});
