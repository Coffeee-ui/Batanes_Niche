import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft, Briefcase, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Spinner } from '../../components/ui';
import type { RegisterPayload } from '../../types';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { from?: string } | null;
  const from = state?.from || '/onboarding';

  const [role, setRole] = useState<'job_seeker' | 'employer'>('job_seeker');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPw) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (!agreeTerms) {
      setError('Please agree to the terms and privacy notice to continue.');
      return;
    }

    setLoading(true);
    try {
      const payload: RegisterPayload = {
        email: email.trim().toLowerCase(),
        password,
        role,
        full_name: role === 'job_seeker' ? fullName.trim() : (companyName.trim() || 'Employer'),
        company_name: role === 'employer' ? companyName.trim() : undefined,
      };

      await register(payload);
      // Direct the user to progressive onboarding flow
      navigate('/onboarding', { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-lg">
        {/* Auth Top Header */}
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

        {/* Card */}
        <div className="card p-6 sm:p-8 shadow-md border border-border bg-surface">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-1">
              Create your account
            </h1>
            <p className="text-xs text-muted-foreground">
              Select your role to get started with Batanes Niche.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="px-3 py-2.5 rounded-xl text-xs font-medium bg-danger/10 border border-danger/30 text-danger">
                {error}
              </div>
            )}

            {/* Role Choice Cards */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                id="btn-role-job_seeker"
                type="button"
                onClick={() => setRole('job_seeker')}
                className={`p-4 rounded-xl text-left border transition-all flex flex-col justify-between ${
                  role === 'job_seeker'
                    ? 'border-primary bg-primary/10 ring-1 ring-primary'
                    : 'border-border bg-surface hover:border-primary/50'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center text-primary mb-2">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground mb-0.5">I'm looking for work</p>
                  <p className="text-[11px] text-muted-foreground">Job Seeker</p>
                </div>
              </button>

              <button
                id="btn-role-employer"
                type="button"
                onClick={() => setRole('employer')}
                className={`p-4 rounded-xl text-left border transition-all flex flex-col justify-between ${
                  role === 'employer'
                    ? 'border-primary bg-primary/10 ring-1 ring-primary'
                    : 'border-border bg-surface hover:border-primary/50'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center text-primary mb-2">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground mb-0.5">I'm hiring</p>
                  <p className="text-[11px] text-muted-foreground">Employer</p>
                </div>
              </button>
            </div>

            {/* Role Specific Input */}
            {role === 'job_seeker' ? (
              <div>
                <label htmlFor="reg-fullname" className="label text-xs">
                  Full name
                </label>
                <input
                  id="reg-fullname"
                  type="text"
                  className="input text-base sm:text-sm"
                  placeholder="e.g. Juan Abad"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                />
              </div>
            ) : (
              <div>
                <label htmlFor="reg-company" className="label text-xs">
                  Employer / Company Name
                </label>
                <input
                  id="reg-company"
                  type="text"
                  className="input text-base sm:text-sm"
                  placeholder="e.g. Basco Seaside Inn & Tours"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  required
                />
              </div>
            )}

            <div>
              <label htmlFor="reg-email" className="label text-xs">
                Email Address
              </label>
              <input
                id="reg-email"
                type="email"
                className="input text-base sm:text-sm"
                placeholder="name@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="reg-password" className="label text-xs">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="reg-password"
                    type={showPw ? 'text' : 'password'}
                    className="input text-base sm:text-sm pr-12"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(s => !s)}
                    className="absolute right-0 top-0 bottom-0 px-3 flex items-center justify-center text-muted-foreground hover:text-foreground"
                    aria-label="Toggle password visibility"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="reg-confirm-password" className="label text-xs">
                  Confirm Password
                </label>
                <input
                  id="reg-confirm-password"
                  type={showPw ? 'text' : 'password'}
                  className="input text-base sm:text-sm"
                  placeholder="Repeat password"
                  value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex items-start gap-2 pt-1">
              <input
                id="reg-terms"
                type="checkbox"
                checked={agreeTerms}
                onChange={e => setAgreeTerms(e.target.checked)}
                className="mt-0.5 rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="reg-terms" className="text-xs text-muted-foreground leading-snug">
                I agree to the{' '}
                <Link to="/privacy" className="text-primary hover:underline">
                  Privacy Notice
                </Link>{' '}
                and terms of service.
              </label>
            </div>

            <button
              id="btn-register-submit"
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3 text-sm font-bold rounded-xl mt-4"
            >
              {loading ? <Spinner size="sm" /> : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-xs mt-6 text-muted-foreground">
            Already registered?{' '}
            <Link
              to="/login"
              state={{ from }}
              id="link-to-login"
              className="font-bold text-foreground hover:underline ml-1"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
