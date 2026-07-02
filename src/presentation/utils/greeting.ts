/**
 * Saudação dinâmica para o topo da Home, conforme o horário local do
 * dispositivo. É só texto de UI (não uma regra de negócio sobre dias de
 * leitura), por isso usa `Date` diretamente em vez de `CalendarDate`.
 */
export function getGreeting(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour < 5) return 'Boa noite!';
  if (hour < 12) return 'Bom dia!';
  if (hour < 18) return 'Boa tarde!';
  return 'Boa noite!';
}
