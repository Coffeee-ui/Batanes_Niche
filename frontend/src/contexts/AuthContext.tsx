import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  authApi, setAccessToken, setRefreshToken,
  getRefreshToken, clearTokens, extractError
} from '../api/client';
import type { User, LoginPayload, RegisterPayload } from '../types';

// ============================================================
// Auth Context Types
// ============================================================
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ============================================================
// AuthProvider
// ============================================================
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // On mount: attempt a silent refresh if refresh token exists
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = getRefreshToken();
        if (token) {
          const refreshData = await authApi.refresh();
          setAccessToken(refreshData.access_token);
          setRefreshToken(refreshData.refresh_token);
          const me = await authApi.me();
          if (!cancelled) setUser(me);
        } else {
          setUser(null);
        }
      } catch {
        clearTokens();
        setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const login = useCallback(async (payload: LoginPayload) => {
    setError(null);
    try {
      const data = await authApi.login(payload);
      setAccessToken(data.access_token);
      setRefreshToken(data.refresh_token);
      const me = await authApi.me();
      setUser(me);
    } catch (err) {
      const msg = extractError(err);
      setError(msg);
      throw new Error(msg);
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    setError(null);
    try {
      const data = await authApi.register(payload);
      setAccessToken(data.access_token);
      setRefreshToken(data.refresh_token);
      const me = await authApi.me();
      setUser(me);
    } catch (err) {
      const msg = extractError(err);
      setError(msg);
      throw new Error(msg);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* ignore */
    } finally {
      clearTokens();
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const me = await authApi.me();
      setUser(me);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      refreshUser,
      error,
      clearError,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================
// Hooks
// ============================================================
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function useRequireAuth(role?: 'job_seeker' | 'employer' | 'admin') {
  const { user, isAuthenticated, isLoading } = useAuth();
  return { user, isAuthenticated, isLoading, hasRole: role ? user?.role === role : true };
}
