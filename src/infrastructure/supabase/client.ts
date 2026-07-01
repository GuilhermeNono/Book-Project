import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'Supabase não configurado. Copie .env.example para .env e preencha ' +
      'EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.',
  );
}

/**
 * Client Supabase único da aplicação. Usa a Publishable key (segura para
 * embutir no app cliente) — nunca a Secret key, que ignora Row Level Security
 * e não deve existir fora de um ambiente de servidor.
 *
 * A sessão é persistida no AsyncStorage para que o login sobreviva ao
 * fechamento do app.
 */
export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
