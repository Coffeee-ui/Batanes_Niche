import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, MapPin, Mail, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Spinner } from '../../components/ui';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { from?: string } | null;
  const from = state?.from || '/dashboard';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        </form>

        <p className="text-center text-sm mt-6" style={{ color: 'hsl(var(--color-text-muted))' }}>
          Don't have an account?{' '}
          <Link to="/register" id="link-to-register" className="font-semibold" style={{ color: 'hsl(var(--color-primary))' }}>
            Create one free
          </Link>
        </p>
      </div>
    </div>
  );
}
