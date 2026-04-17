import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const signIn = (email: string, password: string) =>
  supabase.auth.signInWithPassword({ email, password });

export const signUp = async (email: string, password: string, displayName: string) => {
  const result = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });
  return result;
};

export const logOut = () => supabase.auth.signOut();

export const resetPassword = (email: string) =>
  supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}`,
  });

export const updateDisplayName = (displayName: string) =>
  supabase.auth.updateUser({ data: { display_name: displayName } });
