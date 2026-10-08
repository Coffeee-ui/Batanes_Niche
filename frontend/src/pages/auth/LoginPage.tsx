import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, MapPin, Mail, Lock, User as UserIcon, Briefcase } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authApi } from '../../api/client';
import { Spinner } from '../../components/ui';
import type { DemoStatusResponse, UserRole } from '../../types';

export default function LoginPage() {
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { from?: string } | null;
  const from = state?.from || '/dashboard';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Demo Mode state (Backend-controlled)
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
        // Silently omit Demo Mode controls in production or when unavailable
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
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'hsl(var(--color-bg-alt))' }}
    >
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, hsl(var(--color-primary)), hsl(var(--color-secondary)))' }}
            >
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-xl" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Batanes<span className="gradient-text">Niche</span>
            </span>
          </Link>
          <h1 className="text-2xl font-black mb-1" style={{ color: 'hsl(var(--color-text))' }}>
            Welcome back
          </h1>
          <p className="text-sm" style={{ color: 'hsl(var(--color-text-muted))' }}>
            Sign in to your Batanes Niche account
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl p-6 space-y-4"
          style={{
            background: 'hsl(var(--color-surface))',
            border: '1px solid hsl(var(--color-border-subtle))',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {error && (
            <div
              className="px-4 py-3 rounded-lg text-sm font-medium animate-fade-in"
              style={{
                background: 'hsl(var(--color-danger) / 0.08)',
                border: '1px solid hsl(var(--color-danger) / 0.25)',
                color: 'hsl(var(--color-danger))',
              }}
            >
              {error}
            </div>
          )}

          <div>
            <label htmlFor="login-identifier" className="label">Username or Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(var(--color-text-faint))' }} />
              <input
                id="login-identifier"
                type="text"
                className="input pl-10"
                placeholder="username or you@example.com"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                required
                autoComplete="username"
                autoFocus
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="login-password" className="label mb-0">Password</label>
              <Link to="/forgot-password" id="link-forgot-password" className="text-xs font-medium" style={{ color: 'hsl(var(--color-primary))' }}>
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(var(--color-text-faint))' }} />
              <input
                id="login-password"
                type={showPw ? 'text' : 'password'}
                className="input pl-10 pr-10"
                placeholder="Your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPw(s => !s)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2"
                style={{ color: 'hsl(var(--color-text-faint))' }}
                aria-label="Toggle password visibility"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            id="btn-login-submit"
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full py-3.5 text-base font-bold rounded-xl"
          >
            {loading ? <Spinner size="sm" /> : 'Sign In'}
          </button>

          {demoConfig?.enabled && demoConfig.roles.length > 0 && (
            <div id="demo-access-section" className="pt-5 mt-5 border-t" style={{ borderColor: 'hsl(var(--color-border-subtle))' }}>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'hsl(var(--color-text-muted))' }}>
                  Demo Access
                </span>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                  style={{
                    background: 'hsl(var(--color-primary) / 0.12)',
                    color: 'hsl(var(--color-primary))',
                    border: '1px solid hsl(var(--color-primary) / 0.25)',
                  }}
                >
                  Dev Mode
                </span>
              </div>
              <p className="text-xs mb-3" style={{ color: 'hsl(var(--color-text-muted))' }}>
                One-click instant access for development & demonstration:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {demoConfig.roles.filter(d => d.role === 'job_seeker' || d.role === 'employer').map((demo) => {
                  const isRoleLoading = demoLoadingRole === demo.role;
                  return (
                    <button
                      key={demo.role}
                      id={`btn-demo-${demo.role}`}
                      type="button"
                      disabled={loading || !!demoLoadingRole}
                      onClick={() => handleDemoLogin(demo.role)}
                      className="btn btn-outline py-2.5 px-3 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
                      title={demo.description}
                    >
                      {isRoleLoading ? (
                        <Spinner size="sm" />
                      ) : (
                        <>
                          {demo.role === 'job_seeker' && <UserIcon className="w-3.5 h-3.5" />}
                          {demo.role === 'employer' && <Briefcase className="w-3.5 h-3.5" />}
                          <span>{demo.label}</span>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </form>

        <p className="text-center text-sm mt-6" style={{ color: 'hsl(var(--color-text-muted))' }}>
          Don't have an account?{' '}
          <Link to="/register" state={{ from }} id="link-to-register" className="font-semibold" style={{ color: 'hsl(var(--color-primary))' }}>
            Create one free
          </Link>
        </p>
      </div>
    </div>
  );
}
