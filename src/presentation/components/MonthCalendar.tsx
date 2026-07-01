import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CalendarDate } from '../../domain/value-objects/CalendarDate';
import { theme } from '../theme/theme';
import {
  buildMonthGrid,
  monthLabel,
  shiftMonth,
  WEEKDAY_LABELS,
} from '../utils/calendar';

interface MonthCalendarProps {
  /** Conjunto de datas marcadas em ISO, para consulta O(1). */
  markedDates: Set<string>;
  onToggleDate: (iso: string) => void;
}

/**
 * Calendário mensal navegável. Dias lidos ficam destacados; o dia de hoje tem
 * contorno; datas futuras ficam desabilitadas (não é possível marcá-las).
 */
export function MonthCalendar({ markedDates, onToggleDate }: MonthCalendarProps) {
  const today = CalendarDate.today();
  const [view, setView] = useState({ year: today.year, month: today.month });

  const cells = useMemo(
    () => buildMonthGrid(view.year, view.month),
    [view.year, view.month],
  );

  const goPrev = () => setView((v) => shiftMonth(v.year, v.month, -1));
  const goNext = () => setView((v) => shiftMonth(v.year, v.month, 1));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={goPrev}
          accessibilityLabel="Mês anterior"
          hitSlop={12}
          style={styles.navButton}
        >
          <Text style={styles.navIcon}>‹</Text>
        </Pressable>
        <Text style={styles.title}>{monthLabel(view.year, view.month)}</Text>
        <Pressable
          onPress={goNext}
          accessibilityLabel="Próximo mês"
          hitSlop={12}
          style={styles.navButton}
        >
          <Text style={styles.navIcon}>›</Text>
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAY_LABELS.map((label, index) => (
          <View key={`${label}-${index}`} style={styles.cell}>
            <Text style={styles.weekLabel}>{label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((date, index) => {
          if (!date) {
            return <View key={`blank-${index}`} style={styles.cell} />;
          }

          const iso = date.toISO();
          const isMarked = markedDates.has(iso);
          const isToday = date.isToday();
          const isFuture = date.isFuture();

          return (
            <View key={iso} style={styles.cell}>
              <Pressable
                disabled={isFuture}
                onPress={() => onToggleDate(iso)}
                accessibilityRole="button"
                accessibilityState={{ checked: isMarked, disabled: isFuture }}
                accessibilityLabel={`Dia ${date.day}${isMarked ? ', lido' : ''}`}
                style={[
                  styles.day,
                  isMarked && styles.dayMarked,
                  isToday && styles.dayToday,
                  isFuture && styles.dayFuture,
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    isMarked && styles.dayTextMarked,
                    isFuture && styles.dayTextFuture,
                  ]}
                >
                  {date.day}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceMuted,
  },
  navIcon: {
    color: theme.colors.text,
    fontSize: 22,
    lineHeight: 24,
    fontWeight: '700',
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.font.heading,
    fontWeight: '700',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.font.caption,
    fontWeight: '600',
  },
  day: {
    width: '82%',
    height: '82%',
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceMuted,
  },
  dayMarked: {
    backgroundColor: theme.colors.primary,
  },
  dayToday: {
    borderWidth: 2,
    borderColor: theme.colors.today,
  },
  dayFuture: {
    backgroundColor: 'transparent',
  },
  dayText: {
    color: theme.colors.text,
    fontSize: theme.font.body,
    fontWeight: '600',
  },
  dayTextMarked: {
    color: '#0F1115',
    fontWeight: '800',
  },
  dayTextFuture: {
    color: theme.colors.border,
  },
});
