import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { UserProfile, UserRole } from '../lib/api';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isAnonymous: boolean;
  isLoading: boolean;
  login: (email: string, pass: string, expectedPortal?: 'authority' | 'public') => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: UserRole;
    authorityPasscode?: string;
    skills?: string[];
  }) => Promise<void>;
  googleSignIn: (data: {
    email: string;
    name: string;
    role: UserRole;
    authorityPasscode?: string;
    skills?: string[];
  }) => Promise<void>;
  quickLogin: (role: UserRole) => Promise<void>;
  enableAnonymousMode: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('relief_token'));
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore session from token if present
  useEffect(() => {
    async function restoreSession() {
      if (token) {
        try {
          const res = await api.auth.getMe();
          setUser(res.user);
        } catch {
          // Token expired or invalid, clear it
          setUser(null);
          setToken(null);
          localStorage.removeItem('relief_token');
        }
      }
      setIsLoading(false);
    }
    restoreSession();
  }, []);

  const login = async (email: string, pass: string, expectedPortal?: 'authority' | 'public') => {
    const res = await api.auth.login({ email, password: pass, expectedPortal });
    setToken(res.token);
    setUser(res.user);
    setIsAnonymous(false);
    localStorage.setItem('relief_token', res.token);
  };

  const register = async (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: UserRole;
    authorityPasscode?: string;
    skills?: string[];
  }) => {
    const res = await api.auth.register(data);
    setToken(res.token);
    setUser(res.user);
    setIsAnonymous(false);
    localStorage.setItem('relief_token', res.token);
  };

  const googleSignIn = async (data: {
    email: string;
    name: string;
    role: UserRole;
    authorityPasscode?: string;
    skills?: string[];
  }) => {
    const res = await api.auth.googleLogin(data);
    setToken(res.token);
    setUser(res.user);
    setIsAnonymous(false);
    localStorage.setItem('relief_token', res.token);
  };

  const quickLogin = async (role: UserRole) => {
    try {
      const res = await api.auth.quickLogin(role);
      setToken(res.token);
      setUser(res.user);
      setIsAnonymous(false);
      localStorage.setItem('relief_token', res.token);
    } catch (err) {
      console.error('Quick login failed:', err);
      throw err;
    }
  };

  const enableAnonymousMode = () => {
    setUser({
      id: 0,
      name: 'Anonymous Citizen',
      email: 'citizen@emergency.local',
      phone: '',
      role: 'citizen',
      skills: [],
      status: 'available',
    });
    setIsAnonymous(true);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsAnonymous(false);
    localStorage.removeItem('relief_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isAnonymous,
        isLoading,
        login,
        register,
        googleSignIn,
        quickLogin,
        enableAnonymousMode,
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
