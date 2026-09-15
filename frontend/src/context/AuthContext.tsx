'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, RoleLevel } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  signup: (name: string, email: string, targetRole: string, experienceLevel: RoleLevel, password?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithGithub: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('interview_agent_user');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load user from localStorage:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveUser = (newUser: User | null) => {
    setUser(newUser);
    if (newUser) {
      localStorage.setItem('interview_agent_user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('interview_agent_user');
    }
  };

  const login = async (email: string) => {
    // Generate or fetch user
    const nameFromEmail = email.split('@')[0];
    const capitalizedName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
    const existing: User = {
      id: `user-${Date.now()}`,
      name: capitalizedName,
      email,
      targetRole: 'Full Stack Engineer',
      experienceLevel: 'Mid-Level',
      githubConnected: false,
      createdAt: new Date().toISOString(),
    };
    saveUser(existing);
  };

  const signup = async (
    name: string,
    email: string,
    targetRole: string,
    experienceLevel: RoleLevel
  ) => {
    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      email,
      targetRole: targetRole || 'Full Stack Engineer',
      experienceLevel: experienceLevel || 'Mid-Level',
      githubConnected: false,
      createdAt: new Date().toISOString(),
    };
    saveUser(newUser);
  };

  const loginWithGoogle = async () => {
    const googleUser: User = {
      id: `user-google-${Date.now()}`,
      name: 'Google User',
      email: 'user@gmail.com',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=GoogleUser',
      targetRole: 'Senior Software Engineer',
      experienceLevel: 'Senior',
      githubConnected: false,
      createdAt: new Date().toISOString(),
    };
    saveUser(googleUser);
  };

  const loginWithGithub = async () => {
    const ghUser: User = {
      id: `user-gh-${Date.now()}`,
      name: 'GitHub Engineer',
      email: 'engineer@github.com',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=GitHubEngineer',
      targetRole: 'Staff Backend Architect',
      experienceLevel: 'Senior',
      githubConnected: true,
      createdAt: new Date().toISOString(),
    };
    saveUser(ghUser);
  };

  const logout = () => {
    saveUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
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
