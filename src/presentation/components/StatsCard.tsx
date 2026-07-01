import { StyleSheet, Text, View } from 'react-native';

import { ReadingStats } from '../../domain/services/ReadingStats';
import { theme } from '../theme/theme';

interface StatsCardProps {
  stats: ReadingStats;
}

interface StatItem {
  label: string;
  value: number;
  suffix?: string;
}

/** Painel com as principais métricas de leitura. */
export function StatsCard({ stats }: StatsCardProps) {
  const items: StatItem[] = [
    { label: 'Sequência atual', value: stats.currentStreak, suffix: 'd' },
    { label: 'Melhor sequência', value: stats.longestStreak, suffix: 'd' },
    { label: 'Neste mês', value: stats.thisMonth },
    { label: 'Total', value: stats.total },
  ];

  return (
    <View style={styles.card}>
      {items.map((item) => (
        <View key={item.label} style={styles.item}>
          <Text style={styles.value}>
            {item.value}
            {item.suffix ? <Text style={styles.suffix}>{item.suffix}</Text> : null}
          </Text>
          <Text style={styles.label}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
  },
  item: {
    width: '50%',
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
  },
  value: {
    color: theme.colors.text,
    fontSize: theme.font.title,
    fontWeight: '800',
  },
  suffix: {
    color: theme.colors.textMuted,
    fontSize: theme.font.body,
    fontWeight: '600',
  },
  label: {
    color: theme.colors.textMuted,
    fontSize: theme.font.caption,
    marginTop: theme.spacing.xs,
  },
});
