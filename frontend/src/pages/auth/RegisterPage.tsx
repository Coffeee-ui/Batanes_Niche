import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Spinner } from '../../components/ui';
import type { RegisterPayload } from '../../types';

const MUNICIPALITIES = ['Basco', 'Itbayat', 'Ivana', 'Mahatao', 'Sabtang', 'Uyugan'];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { from?: string } | null;
  const from = state?.from || '/dashboard';

  const [form, setForm] = useState<RegisterPayload>({
    username: '',
    email: '',
    password: '',
    full_name: '',
    role: 'job_seeker',
    municipality: '',
    barangay: '',
    phone_number: '',
    company_name: '',
  });
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof RegisterPayload) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== confirmPw) {
      setError('Passwords do not match.');
      return;
    }
    if (!form.municipality) {
      setError('Please select your municipality.');
      return;
    }
    setLoading(true);
    try {
      const payload: RegisterPayload = {
        ...form,
        username: form.username.trim() || form.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') + '_' + Math.floor(Math.random() * 1000),
      };
      await register(payload);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Card */}
        <div className="card p-8 shadow-md">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-1">
              Create your account
            </h1>
            <p className="text-xs text-muted-foreground">
              Choose how you will use Batanes Jobs.
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
                onClick={() => setForm(f => ({ ...f, role: 'job_seeker' }))}
                className={`p-4 rounded-xl text-left border transition-all ${
                  form.role === 'job_seeker'
                    ? 'border-primary bg-highlight'
                    : 'border-border bg-surface hover:border-primary/50'
                }`}
              >
                <p className="text-xs font-bold text-foreground mb-0.5">I'm looking for work</p>
                <p className="text-[11px] text-muted-foreground">Job seeker</p>
              </button>

              <button
                id="btn-role-employer"
                type="button"
                onClick={() => setForm(f => ({ ...f, role: 'employer' }))}
                className={`p-4 rounded-xl text-left border transition-all ${
                  form.role === 'employer'
                    ? 'border-primary bg-highlight'
                    : 'border-border bg-surface hover:border-primary/50'
                }`}
              >
                <p className="text-xs font-bold text-foreground mb-0.5">I'm hiring</p>
                <p className="text-[11px] text-muted-foreground">Employer</p>
              </button>
            </div>

            {/* Form Fields */}
            <div>
              <label htmlFor="reg-fullname" className="label text-xs">
                Full name
              </label>
              <input
                id="reg-fullname"
                type="text"
                className="input text-sm"
                placeholder="Maria Elena"
                value={form.full_name}
                onChange={set('full_name')}
                required
              />
            </div>

            {form.role === 'employer' && (
              <div>
                <label htmlFor="reg-company" className="label text-xs">
                  Company / Organization Name
                </label>
                <input
                  id="reg-company"
                  type="text"
                  className="input text-sm"
                  placeholder="e.g. Basco Seaside Inn"
                  value={form.company_name || ''}
                  onChange={set('company_name')}
                  required
                />
              </div>
            )}

            <div>
              <label htmlFor="reg-email" className="label text-xs">
                Email
              </label>
              <input
                id="reg-email"
                type="email"
                className="input text-sm"
                placeholder="maria@example.com"
                value={form.email}
                onChange={set('email')}
                required
              />
            </div>

            <div>
              <label htmlFor="reg-municipality" className="label text-xs">
                Municipality
              </label>
              <select
                id="reg-municipality"
                className="input select text-sm"
                value={form.municipality}
                onChange={set('municipality')}
                required
              >
                <option value="">Select your municipality…</option>
                {MUNICIPALITIES.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
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
                    className="input text-sm pr-9"
                    placeholder="Min. 8 characters"
                    value={form.password}
                    onChange={set('password')}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Toggle password visibility"
                  >
                    {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
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
                  className="input text-sm"
                  placeholder="Repeat password"
                  value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              id="btn-register-submit"
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3 text-sm font-bold rounded-xl mt-4"
            >
              {loading ? <Spinner size="sm" /> : 'Create account'}
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
