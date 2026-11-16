import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { DEMO_USER_ID } from '../data/seed';
import { getSupabaseClient } from '../lib/supabase';
import { isSupabaseEnabled } from '../lib/runtime';

export type UserRole = 'CITIZEN' | 'ADMIN';
export interface AuthUser { id: string; email: string | null; }
export interface UserProfile { id: string; email: string; fullName: string; role: UserRole; }

type SignUpResult = { needsEmailConfirmation: boolean };
interface AuthContextValue {
  user: AuthUser | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  signIn(email: string, password: string): Promise<void>;
  signUp(fullName: string, email: string, password: string): Promise<SignUpResult>;
  signOut(): Promise<void>;
  clearError(): void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const mockUser: AuthUser = { id: DEMO_USER_ID, email: 'cidadao@demo.br' };
const mockProfile: UserProfile = { id: DEMO_USER_ID, email: 'cidadao@demo.br', fullName: 'Cidadão demonstrativo', role: 'CITIZEN' };

function authError(message: string): string {
  if (message.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (message.includes('Email not confirmed')) return 'Confirme seu e-mail antes de entrar.';
  if (message.includes('User already registered')) return 'Já existe uma conta com este e-mail.';
  return message;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(isSupabaseEnabled ? null : mockUser);
  const [profile, setProfile] = useState<UserProfile | null>(isSupabaseEnabled ? null : mockProfile);
  const [loading, setLoading] = useState(isSupabaseEnabled);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async (session: Session | null) => {
    if (!session?.user) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }
    setUser({ id: session.user.id, email: session.user.email ?? null });
    const client = getSupabaseClient();
    const { data, error: profileError } = await client
      .from('profiles')
      .select('id, email, full_name, role')
      .eq('id', session.user.id)
      .single();
    if (profileError) {
      setError('Não foi possível carregar seu perfil.');
      setProfile(null);
    } else {
      const row = data as { id: string; email: string; full_name: string; role: UserRole };
      setProfile({ id: row.id, email: row.email, fullName: row.full_name, role: row.role });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isSupabaseEnabled) return;
    const client = getSupabaseClient();
    let active = true;
    client.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError) {
        setError(authError(sessionError.message));
        setLoading(false);
        return;
      }
      void loadProfile(data.session);
    });
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => { if (active) void loadProfile(session); }, 0);
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    const { error: signInError } = await getSupabaseClient().auth.signInWithPassword({ email, password });
    if (signInError) {
      const message = authError(signInError.message);
      setError(message);
      setLoading(false);
      throw new Error(message);
    }
  }, []);

  const signUp = useCallback(async (fullName: string, email: string, password: string): Promise<SignUpResult> => {
    setError(null);
    setLoading(true);
    const { data, error: signUpError } = await getSupabaseClient().auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    setLoading(false);
    if (signUpError) {
      const message = authError(signUpError.message);
      setError(message);
      throw new Error(message);
    }
    return { needsEmailConfirmation: !data.session };
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    const { error: signOutError } = await getSupabaseClient().auth.signOut();
    if (signOutError) {
      const message = authError(signOutError.message);
      setError(message);
      throw new Error(message);
    }
    setUser(null);
    setProfile(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user, profile, loading, error, isAdmin: profile?.role === 'ADMIN', signIn, signUp, signOut,
    clearError: () => setError(null),
  }), [user, profile, loading, error, signIn, signUp, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('AuthProvider ausente.');
  return context;
}
