import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import type { UserProfile, LoginPayload, RegisterPayload } from '@/types/api';

interface AuthContextValue {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  updateUser: (user: UserProfile) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('nutriid_token'));
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    api.getMe()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem('nutriid_token');
        setToken(null);
        navigate('/login');
      })
      .finally(() => setIsLoading(false));
  }, [token]);

  const login = useCallback(async (payload: LoginPayload) => {
    const data = await api.login(payload);
    localStorage.setItem('nutriid_token', data.token);
    setToken(data.token);
    // user profile is loaded by the useEffect → getMe()
    navigate('/dashboard');
  }, [navigate]);

  const register = useCallback(async (payload: RegisterPayload) => {
    const data = await api.register(payload);
    localStorage.setItem('nutriid_token', data.token);
    setToken(data.token);
    // user profile is loaded by the useEffect → getMe()
    navigate('/dashboard');
  }, [navigate]);

  const logout = useCallback(() => {
    localStorage.removeItem('nutriid_token');
    setToken(null);
    setUser(null);
    navigate('/login');
  }, [navigate]);

  const updateUser = useCallback((u: UserProfile) => setUser(u), []);

  return (
    <AuthContext.Provider value={{
      token,
      user,
      isAuthenticated: !!token,
      isLoading,
      login,
      register,
      logout,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
}
