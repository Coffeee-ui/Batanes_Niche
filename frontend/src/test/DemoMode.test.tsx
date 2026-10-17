import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginPage from '../pages/auth/LoginPage';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { authApi, setAccessToken, setRefreshToken } from '../api/client';
import { renderHook, act } from '@testing-library/react';

vi.mock('../api/client', () => ({
  authApi: {
    me: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    refresh: vi.fn(),
    getDemoStatus: vi.fn(),
    demoLogin: vi.fn(),
  },
  setAccessToken: vi.fn(),
  setRefreshToken: vi.fn(),
  getRefreshToken: vi.fn(),
  clearTokens: vi.fn(),
  extractError: (err: any) => err?.message || 'Error occurred',
}));

describe('Demo Mode Frontend Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AuthContext demoLogin', () => {
    it('successfully logs in via demoLogin and updates user state', async () => {
      (authApi.refresh as any).mockRejectedValue(new Error('No token'));
      const mockUser = {
        id: 3,
        username: 'ivatan_guide',
        email: 'juan@batanesguide.ph',
        full_name: 'Juan Abad',
        role: 'job_seeker',
        municipality: 'Basco',
        island: 'Batan',
        profile_completeness: 90,
        account_status: 'active',
        created_at: new Date().toISOString(),
      };

      (authApi.demoLogin as any).mockResolvedValue({
        access_token: 'demo-access-token',
        refresh_token: 'demo-refresh-token',
        token_type: 'bearer',
        role: 'job_seeker',
        username: 'ivatan_guide',
      });
      (authApi.me as any).mockResolvedValue(mockUser);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.demoLogin('job_seeker');
      });

      expect(authApi.demoLogin).toHaveBeenCalledWith('job_seeker');
      expect(setAccessToken).toHaveBeenCalledWith('demo-access-token');
      expect(setRefreshToken).toHaveBeenCalledWith('demo-refresh-token');
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('LoginPage Demo Mode UI', () => {
    it('does NOT display Demo Access section when Demo Mode is disabled', async () => {
      (authApi.getDemoStatus as any).mockResolvedValue({
        enabled: false,
        roles: [],
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <LoginPage />
          </AuthProvider>
        </BrowserRouter>
      );

      // Normal login elements exist
      expect(screen.getByLabelText(/username or email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();

      // Demo elements do not exist
      expect(screen.queryByText(/demo access/i)).not.toBeInTheDocument();
      expect(screen.queryByTestId('demo-access-section')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /job seeker/i })).not.toBeInTheDocument();
    });

    it('displays Demo Access buttons when Demo Mode is enabled by backend', async () => {
      (authApi.getDemoStatus as any).mockResolvedValue({
        enabled: true,
        roles: [
          { role: 'job_seeker', label: 'Job Seeker', description: 'Seeker description' },
          { role: 'employer', label: 'Employer', description: 'Employer description' },
          { role: 'admin', label: 'Administrator', description: 'Admin description' },
        ],
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <LoginPage />
          </AuthProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/demo access/i)).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /job seeker/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /employer/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /administrator/i })).not.toBeInTheDocument();
    });

    it('triggers demo login when a demo button is clicked', async () => {
      (authApi.getDemoStatus as any).mockResolvedValue({
        enabled: true,
        roles: [
          { role: 'job_seeker', label: 'Job Seeker', description: 'Seeker description' },
        ],
      });
      (authApi.demoLogin as any).mockResolvedValue({
        access_token: 'demo-token',
        refresh_token: 'demo-refresh',
        token_type: 'bearer',
        role: 'job_seeker',
        username: 'ivatan_guide',
      });
      (authApi.me as any).mockResolvedValue({
        id: 3,
        username: 'ivatan_guide',
        role: 'job_seeker',
        full_name: 'Juan Abad',
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <LoginPage />
          </AuthProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /job seeker/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /job seeker/i }));

      await waitFor(() => {
        expect(authApi.demoLogin).toHaveBeenCalledWith('job_seeker');
      });
    });
  });
});
