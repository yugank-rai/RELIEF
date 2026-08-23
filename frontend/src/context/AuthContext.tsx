import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { UserProfile } from '../lib/api';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  quickSwitchRole: (role: 'citizen' | 'volunteer' | 'authority' | 'resource_manager') => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('relief_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize or quick-login as authority by default for instant command center preview
  useEffect(() => {
    async function initAuth() {
      if (token) {
        try {
          const res = await api.auth.getMe();
          setUser(res.user);
        } catch {
          // Token invalid, do quick-login as authority
          await quickSwitchRole('authority');
        }
      } else {
        await quickSwitchRole('authority');
      }
      setIsLoading(false);
    }
    initAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.auth.login({ email, password: pass });
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('relief_token', res.token);
  };

  const quickSwitchRole = async (role: 'citizen' | 'volunteer' | 'authority' | 'resource_manager') => {
    try {
      const res = await api.auth.quickLogin(role);
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('relief_token', res.token);
    } catch (err) {
      console.warn('Quick login failed:', err);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('relief_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        quickSwitchRole,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
