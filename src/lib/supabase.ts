import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const isSupabaseConfigured = (): boolean => {
  if (!supabaseUrl || !supabaseAnonKey) return false;
  if (supabaseUrl.includes('placeholder') || supabaseUrl.includes('your-project-id')) return false;
  if (supabaseAnonKey === 'placeholder-key' || supabaseAnonKey === 'your-supabase-anon-key') return false;
  return true;
};

export const getSupabaseConfigStatus = (): { configured: boolean; message: string } => {
  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      message: 'Supabase configuration missing or using placeholders. Please add your real VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your local .env file.',
    };
  }
  return { configured: true, message: 'Configured' };
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
