'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from 'next-auth/react';
import { User, RoleLevel } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  signup: (name: string, email: string, targetRole: string, experienceLevel: RoleLevel, password?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithGithub: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [localUser, setLocalUser] = useState<User | null>(null);
  const [loadingLocal, setLoadingLocal] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('interview_agent_user');
      if (stored) {
        setLocalUser(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load user from localStorage:', e);
    } finally {
      setLoadingLocal(false);
    }
  }, []);

  // Compute active user: NextAuth OAuth session takes precedence if active, otherwise local candidate account
  const activeUser: User | null = React.useMemo(() => {
    if (status === 'authenticated' && session?.user) {
      const isGitHub = (session as any)?.provider === 'github';
      return {
        id: (session.user as any)?.id || session.user.email || 'oauth-user',
        name: session.user.name || 'Candidate',
        email: session.user.email || '',
        avatarUrl: session.user.image || undefined,
        targetRole: localUser?.targetRole || 'Full Stack Engineer',
        experienceLevel: localUser?.experienceLevel || 'Senior',
        githubConnected: isGitHub || Boolean((session as any)?.accessToken),
        githubAccessTokenRef: (session as any)?.accessToken,
        createdAt: localUser?.createdAt || new Date().toISOString(),
      };
    }
    return localUser;
  }, [session, status, localUser]);

  const saveLocalUser = (newUser: User | null) => {
    setLocalUser(newUser);
    if (newUser) {
      localStorage.setItem('interview_agent_user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('interview_agent_user');
    }
  };

  const login = async (email: string) => {
    const nameFromEmail = email.split('@')[0];
    const capitalizedName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
    const candidate: User = {
      id: `user-${Date.now()}`,
      name: capitalizedName,
      email,
      targetRole: 'Full Stack Engineer',
      experienceLevel: 'Senior',
      githubConnected: false,
      createdAt: new Date().toISOString(),
    };
    saveLocalUser(candidate);
  };

  const signup = async (
    name: string,
    email: string,
    targetRole: string,
    experienceLevel: RoleLevel
  ) => {
    const candidate: User = {
      id: `user-${Date.now()}`,
      name,
      email,
      targetRole: targetRole || 'Full Stack Engineer',
      experienceLevel: experienceLevel || 'Senior',
      githubConnected: false,
      createdAt: new Date().toISOString(),
    };
    saveLocalUser(candidate);
  };

  const loginWithGoogle = async () => {
    await nextAuthSignIn('google');
  };

  const loginWithGithub = async () => {
    await nextAuthSignIn('github');
  };

  const logout = async () => {
    saveLocalUser(null);
    if (status === 'authenticated') {
      await nextAuthSignOut({ callbackUrl: '/' });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: activeUser,
        loading: status === 'loading' && loadingLocal,
        login,
        signup,
        loginWithGoogle,
        loginWithGithub,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
