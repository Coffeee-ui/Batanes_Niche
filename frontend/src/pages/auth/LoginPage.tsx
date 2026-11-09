import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authApi } from '../../api/client';
import { Spinner } from '../../components/ui';
import type { DemoStatusResponse, UserRole } from '../../types';

export default function LoginPage() {
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { from?: string } | null;
  const from = state?.from || '/';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Demo Mode state
  const [demoConfig, setDemoConfig] = useState<DemoStatusResponse | null>(null);
  const [demoLoadingRole, setDemoLoadingRole] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    authApi.getDemoStatus()
      .then(res => {
        if (isMounted && res?.enabled) {
          setDemoConfig(res);
        }
      })
      .catch(() => {
        if (isMounted) setDemoConfig(null);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ username_or_email: identifier.trim(), password });
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: UserRole) => {
    setError('');
    setDemoLoadingRole(role);
    try {
      await demoLogin(role);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Demo authentication failed.';
      setError(msg);
    } finally {
      setDemoLoadingRole(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Auth Top Header (NAV-01) */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="text-xl font-black text-foreground tracking-tight hover:opacity-90">
            Batanes <span className="text-primary">Niche</span>
          </Link>
          <Link
            to="/jobs"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to jobs</span>
          </Link>
        </div>

        {/* Form Card */}
        <div className="card p-8 shadow-md">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-1">
              Welcome back
            </h1>
            <p className="text-xs text-muted-foreground">
              Sign in to find or post jobs in Batanes.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="px-3 py-2.5 rounded-xl text-xs font-medium bg-danger/10 border border-danger/30 text-danger">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="login-identifier" className="label text-xs">
                Username or Email
              </label>
              <input
                id="login-identifier"
                type="text"
                className="input text-base sm:text-sm"
                placeholder="name@example.com"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                required
                autoComplete="username"
                autoFocus
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="label text-xs mb-0">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  className="input text-base sm:text-sm pr-12"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(s => !s)}
                  className="absolute right-0 top-0 bottom-0 px-3.5 flex items-center justify-center text-muted-foreground hover:text-foreground min-w-[44px] min-h-[44px]"
                  aria-label="Toggle password visibility"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="text-left mt-2">
                <Link
                  to="/forgot-password"
                  id="link-forgot-password"
                  className="text-xs text-foreground font-medium hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              id="btn-login-submit"
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3 text-sm font-bold rounded-xl mt-2"
            >
              {loading ? <Spinner size="sm" /> : 'Sign in'}
            </button>
          </form>

          {/* Sign up prompt */}
          <p className="text-center text-xs mt-6 text-muted-foreground">
            No account yet?{' '}
            <Link
              to="/register"
              state={{ from }}
              id="link-to-register"
              className="font-bold text-foreground hover:underline ml-1"
            >
              Sign up
            </Link>
          </p>

          {/* Demo Access (Strictly Job Seeker & Employer only) */}
          {demoConfig?.enabled && (
            <div
              id="demo-access-section"
              data-testid="demo-access-section"
              className="pt-6 mt-6 border-t border-border"
            >
              <p className="text-xs text-muted-foreground mb-3 text-center">
                Demo access: try the app in one click
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="btn-demo-job_seeker"
                  type="button"
                  disabled={loading || Boolean(demoLoadingRole)}
                  onClick={() => handleDemoLogin('job_seeker')}
                  className="btn btn-secondary py-2.5 px-3 text-xs font-semibold rounded-xl"
                >
                  {demoLoadingRole === 'job_seeker' ? <Spinner size="sm" /> : 'Job seeker demo'}
                </button>

                <button
                  id="btn-demo-employer"
                  type="button"
                  disabled={loading || Boolean(demoLoadingRole)}
                  onClick={() => handleDemoLogin('employer')}
                  className="btn btn-secondary py-2.5 px-3 text-xs font-semibold rounded-xl"
                >
                  {demoLoadingRole === 'employer' ? <Spinner size="sm" /> : 'Employer demo'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
