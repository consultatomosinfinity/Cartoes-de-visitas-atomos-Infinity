import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import {
  initSupabase,
  authSignIn,
  authSignUp,
  authSignOut,
  authResetPassword,
  authGetSession,
  getUserProfile,
  isMasterEmail,
  MASTER_EMAILS,
} from '../lib/supabase.ts';
import { UserProfile, UserRole, UserPlan } from '../types.ts';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  role: UserRole;
  plan: UserPlan;
  isMaster: boolean;
  isAdminOrMaster: boolean;
  loading: boolean;
  isConfigured: boolean;
  signIn: (email: string, pass: string) => Promise<any>;
  signUp: (email: string, pass: string, fullName?: string) => Promise<any>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<any>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  role: 'cliente',
  plan: 'degustacao',
  isMaster: false,
  isAdminOrMaster: false,
  loading: true,
  isConfigured: false,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);

  const fetchProfileForUser = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setProfile(null);
      return;
    }

    const email = currentUser.email || '';
    const masterAccount = isMasterEmail(email);

    try {
      const p = await getUserProfile(currentUser.id);
      if (p) {
        if (masterAccount) {
          p.role = 'master';
          p.plan = 'corporativo';
        }
        setProfile(p);
      } else {
        // Perfil preliminar enquanto carrega ou se não criado
        setProfile({
          id: currentUser.id,
          email,
          fullName: currentUser.user_metadata?.full_name || '',
          role: masterAccount ? 'master' : ((currentUser.user_metadata?.role as UserRole) || 'cliente'),
          plan: masterAccount ? 'corporativo' : ((currentUser.user_metadata?.plan as UserPlan) || 'degustacao'),
          status: 'ativo',
        });
      }
    } catch {
      if (masterAccount) {
        setProfile({
          id: currentUser.id,
          email,
          fullName: currentUser.user_metadata?.full_name || 'Conta Master',
          role: 'master',
          plan: 'corporativo',
          status: 'ativo',
        });
      }
    }
  }, []);

  const refreshProfile = async () => {
    if (user) {
      await fetchProfileForUser(user);
    }
  };

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      try {
        const client = await initSupabase();
        if (!client) {
          if (mounted) {
            setIsConfigured(false);
            setLoading(false);
          }
          return;
        }

        if (mounted) setIsConfigured(true);

        const currentSession = await authGetSession();
        if (mounted) {
          setSession(currentSession);
          const currentUser = currentSession?.user ?? null;
          setUser(currentUser);
          if (currentUser) {
            fetchProfileForUser(currentUser);
          }
        }

        const { data: authListener } = client.auth.onAuthStateChange(async (_event, newSession) => {
          if (mounted) {
            setSession(newSession);
            const currentUser = newSession?.user ?? null;
            setUser(currentUser);
            if (currentUser) {
              await fetchProfileForUser(currentUser);
            } else {
              setProfile(null);
            }
            setLoading(false);
          }
        });

        return () => {
          authListener?.subscription?.unsubscribe();
        };
      } catch (err) {
        console.error('Erro na inicialização da autenticação:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    checkAuth();

    return () => {
      mounted = false;
    };
  }, [fetchProfileForUser]);

  const signIn = async (email: string, pass: string) => {
    const data = await authSignIn(email, pass);
    setUser(data.user);
    setSession(data.session);
    if (data.user) {
      await fetchProfileForUser(data.user);
    }
    return data;
  };

  const signUp = async (email: string, pass: string, fullName?: string) => {
    const data = await authSignUp(email, pass, fullName);
    if (data.session) {
      setUser(data.user);
      setSession(data.session);
      if (data.user) {
        await fetchProfileForUser(data.user);
      }
    }
    return data;
  };

  const signOut = async () => {
    await authSignOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    return await authResetPassword(email);
  };

  const userEmail = user?.email?.toLowerCase() || '';
  const isMaster = isMasterEmail(userEmail) || profile?.role === 'master';
  const role: UserRole = isMaster ? 'master' : (profile?.role || 'cliente');
  const plan: UserPlan = isMaster ? 'corporativo' : (profile?.plan || 'degustacao');
  const isAdminOrMaster = isMaster || role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        plan,
        isMaster,
        isAdminOrMaster,
        loading,
        isConfigured,
        signIn,
        signUp,
        signOut,
        resetPassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
