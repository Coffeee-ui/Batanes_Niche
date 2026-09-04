import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { authApi, setAccessToken, setRefreshToken, clearTokens } from '../api/client';

// Mock authApi
vi.mock('../api/client', () => ({
  authApi: {
    me: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    refresh: vi.fn(),
  },
  setAccessToken: vi.fn(),
  setRefreshToken: vi.fn(),
  getRefreshToken: vi.fn(),
  clearTokens: vi.fn(),
}));

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  });

  it('provides default unauthenticated state when no token is present', async () => {
    (authApi.refresh as any).mockRejectedValue(new Error('No token'));

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('successful login saves tokens and sets user state', async () => {
    const mockUser = {
      id: 1,
      username: 'ivatan_coder',
      email: 'coder@batanes.ph',
      full_name: 'Ivatan Coder',
      role: 'job_seeker',
      municipality: 'Basco',
      island: 'Batan',
      profile_completeness: 85,
      account_status: 'active',
      created_at: new Date().toISOString(),
    };

    (authApi.login as any).mockResolvedValue({
      access_token: 'fake-access-token',
      refresh_token: 'fake-refresh-token',
      token_type: 'bearer',
    });
    (authApi.me as any).mockResolvedValue(mockUser);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login({ username_or_email: 'ivatan_coder', password: 'Secret123!' });
    });

    expect(setAccessToken).toHaveBeenCalledWith('fake-access-token');
    expect(setRefreshToken).toHaveBeenCalledWith('fake-refresh-token');
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('logout clears tokens and resets user state', async () => {
    (authApi.logout as any).mockResolvedValue({ message: 'Logged out' });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.logout();
    });

    expect(clearTokens).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
