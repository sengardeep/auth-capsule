'use client';

/**
 * Auth Context
 * Stores the access token and user info in React state.
 * Persists the access token in localStorage so it survives page refreshes.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import * as api from './api';
import type { UserInfo } from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: UserInfo | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearAuth: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

const ACCESS_TOKEN_KEY = 'auth_access_token';

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: restore token from localStorage and fetch user
  useEffect(() => {
    const stored = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (stored) {
      setAccessToken(stored);
      api
        .getMe(stored)
        .then((res) => setUser(res.user ?? null))
        .catch(() => {
          // Token is invalid or expired — clear it
          localStorage.removeItem(ACCESS_TOKEN_KEY);
          setAccessToken(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const saveToken = (token: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    setAccessToken(token);
  };

  const clearAuth = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    setAccessToken(null);
    setUser(null);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login(email, password);
    if (res.accessToken) {
      saveToken(res.accessToken);
      setUser(res.user ?? null);
    }
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    clearAuth();
  }, [clearAuth]);

  const logoutAll = useCallback(async () => {
    await api.logoutAll();
    clearAuth();
  }, [clearAuth]);

  const refreshToken = useCallback(async () => {
    const res = await api.refreshToken();
    if (res.accessToken) {
      saveToken(res.accessToken);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, accessToken, isLoading, login, logout, logoutAll, refreshToken, clearAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
