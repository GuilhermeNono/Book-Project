/**
 * Design tokens centralizados. Manter cores/espacamentos em um só lugar deixa
 * a UI consistente e fácil de re-temar.
 */
export const theme = {
  colors: {
    background: '#0F1115',
    surface: '#1A1D24',
    surfaceMuted: '#232732',
    primary: '#6C8CFF',
    primaryMuted: '#2A3352',
    accent: '#FFB86C',
    text: '#F5F7FA',
    textMuted: '#9AA3B2',
    success: '#5AD19A',
    border: '#2C313C',
    today: '#FFB86C',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 20,
    pill: 999,
  },
  font: {
    title: 28,
    heading: 20,
    body: 16,
    caption: 13,
  },
} as const;

export type Theme = typeof theme;
