import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../supabase';
import type { User } from '@supabase/supabase-js';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isRecovery: boolean;
  clearRecovery: () => void;
}

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true, isRecovery: false, clearRecovery: () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const clearRecovery = () => setIsRecovery(false);

  return (
    <AuthContext.Provider value={{ user, loading, isRecovery, clearRecovery }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
