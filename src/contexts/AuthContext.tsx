import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'customer' | 'admin';
}

interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: any }>;
  signup: (username: string, email: string, password: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (id: string, email: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('username, role')
        .eq('id', id)
        .maybeSingle();
      
      // Role is ONLY sourced from the database. Never inferred from email content.
      const role: 'customer' | 'admin' = data?.role === 'admin' ? 'admin' : 'customer';

      if (data?.username) {
        setCurrentUser(prev => prev ? { ...prev, username: data.username, role } : { id, email, username: data.username, role });
      } else {
        setCurrentUser(prev => prev ? { ...prev, role } : null);
      }
    } catch {
      // Background profile fetch failure is non-blocking
    }
  };

  useEffect(() => {
    let isMounted = true;

    const resolveAuth = (user: any | null) => {
      if (!isMounted) return;
      if (user) {
        const fallbackUsername = user.user_metadata?.username || user.email?.split('@')[0] || 'shopper';
        // Default role to 'customer'; fetchProfile will update to 'admin' if DB confirms it.
        const role: 'customer' | 'admin' = 'customer';
        setCurrentUser({
          id: user.id,
          email: user.email || '',
          username: fallbackUsername,
          role,
        });
        setLoading(false);
        // Enrich profile (including authoritative role) in background
        fetchProfile(user.id, user.email || '');
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    };

    // Initial session retrieval
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        resolveAuth(session?.user ?? null);
      })
      .catch(() => {
        resolveAuth(null);
      });

    // Fallback safety watchdog to guarantee loading is never stuck
    const safetyWatchdog = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
      }
    }, 2500);

    // Auth state listener for sign in, sign out, token refresh
    let subscription: { unsubscribe: () => void } | null = null;
    try {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        resolveAuth(session?.user ?? null);
      });
      subscription = data?.subscription ?? null;
    } catch (err) {
      console.warn('[AuthContext] onAuthStateChange setup error:', err);
      resolveAuth(null);
    }

    return () => {
      isMounted = false;
      clearTimeout(safetyWatchdog);
      subscription?.unsubscribe();
    };
  }, []);


  const getDetailedAuthError = (errMessage: string) => {
    if (!isSupabaseConfigured()) {
      return 'Configuration required: Please create a local .env file with your valid VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.';
    }
    if (errMessage?.includes('Failed to fetch') || errMessage?.includes('fetch failed')) {
      return 'Database offline: Your Supabase project is paused or deleted. Please open the Supabase Dashboard (https://supabase.com/dashboard) and restore/unpause your project.';
    }
    return errMessage;
  };

  const login = async (emailOrUsername: string, password: string) => {
    if (!isSupabaseConfigured()) {
      return { error: { message: getDetailedAuthError('') } };
    }

    let targetEmail = emailOrUsername.trim();
    
    if (!targetEmail.includes('@')) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', targetEmail)
          .maybeSingle();

        if (error) {
          return { error: { message: getDetailedAuthError(error.message) } };
        }
        if (!data) {
          return { error: { message: 'Username or password is incorrect' } };
        }
        targetEmail = data.email;
      } catch (err: any) {
        return { error: { message: getDetailedAuthError(err.message || '') } };
      }
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password,
      });
      if (error) {
        if (error.message === 'Invalid login credentials') {
          return { error: { message: 'Username or password is incorrect' } };
        }
        return { error: { message: getDetailedAuthError(error.message) } };
      }

      // Immediately resolve user profile and set currentUser state before returning
      if (data?.user) {
        let username = data.user.email?.split('@')[0] || 'shopper';
        // Role is ONLY authoritative from DB. Default to 'customer' until confirmed.
        let role: 'customer' | 'admin' = 'customer';
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, role')
            .eq('id', data.user.id)
            .maybeSingle();
          if (profile?.username) {
            username = profile.username;
          }
          if (profile?.role === 'admin') {
            role = 'admin';
          }
        } catch (e) {
          // ignore profile lookup fallback
        }

        setCurrentUser({
          id: data.user.id,
          email: data.user.email || targetEmail,
          username,
          role,
        });
        setLoading(false);
      }

      return { error: null };
    } catch (err: any) {
      return { error: { message: getDetailedAuthError(err.message || '') } };
    }
  };

  const signup = async (username: string, email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      return { error: { message: getDetailedAuthError('') } };
    }

    try {
      // All new signups receive 'customer' role. Admin role is only granted manually
      // by a database administrator via: UPDATE public.profiles SET role = 'admin' WHERE email = '...';
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            role: 'customer',
          },
        },
      });
      if (error) {
        return { error: { message: getDetailedAuthError(error.message) } };
      }
      return { error: null };
    } catch (err: any) {
      return { error: { message: getDetailedAuthError(err.message || '') } };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('[AuthContext] logout error:', err);
    } finally {
      setCurrentUser(null);
      setLoading(false);
    }
  };

  const resetPassword = async (emailOrUsername: string) => {
    let targetEmail = emailOrUsername;
    
    if (!emailOrUsername.includes('@')) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', emailOrUsername)
          .maybeSingle();

        if (error) {
          return { error };
        }
        if (!data) {
          return { error: { message: 'Username not found' } };
        }
        targetEmail = data.email;
      } catch (err: any) {
        return { error: err };
      }
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        if (error.message === 'Failed to fetch') {
          return { error: { message: 'Database offline: The Supabase project is paused or deleted. Please restore it or check your .env configuration.' } };
        }
        return { error };
      }
      return { error: null };
    } catch (err: any) {
      if (err.message?.includes('Failed to fetch')) {
        return { error: { message: 'Database offline: The Supabase project is paused or deleted. Please restore it or check your .env configuration.' } };
      }
      return { error: err };
    }
  };

  const isAuthenticated = currentUser !== null;
  const isAdmin = currentUser?.role === 'admin';

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAdmin, currentUser, loading, login, signup, logout, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
