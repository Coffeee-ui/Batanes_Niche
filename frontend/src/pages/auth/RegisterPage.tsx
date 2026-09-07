import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, MapPin, Briefcase, User, Mail, Lock, Phone } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Spinner } from '../../components/ui';
import type { RegisterPayload } from '../../types';

const MUNICIPALITIES = ['Basco', 'Itbayat', 'Ivana', 'Mahatao', 'Sabtang', 'Uyugan'];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<RegisterPayload>({
    username: '',
    email: '',
    password: '',
    full_name: '',
    role: 'job_seeker',
    municipality: '',
    barangay: '',
    phone_number: '',
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
      const payload = {
        ...form,
        username: form.username.trim() || form.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') + '_' + Math.floor(Math.random() * 1000),
      };
      await register(payload);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed.';
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
      <div className="w-full max-w-lg">
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
            Create your account
          </h1>
          <p className="text-sm" style={{ color: 'hsl(var(--color-text-muted))' }}>
            Join the Batanes employment community
          </p>
        </div>

        {/* Role Selector */}
        <div
          className="flex rounded-xl p-1 mb-6"
          style={{ background: 'hsl(var(--color-bg-alt))', border: '1px solid hsl(var(--color-border))' }}
        >
          {(['job_seeker', 'employer'] as const).map(role => (
            <button
              key={role}
              id={`btn-role-${role}`}
              type="button"
              onClick={() => setForm(f => ({ ...f, role }))}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
              style={
                form.role === role
                  ? {
                      background: 'linear-gradient(135deg, hsl(var(--color-primary)), hsl(var(--color-secondary)))',
                      color: 'white',
                      boxShadow: '0 2px 8px hsl(var(--color-primary) / 0.3)',
                    }
                  : { color: 'hsl(var(--color-text-muted))' }
              }
            >
              {role === 'job_seeker' ? <User className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
              {role === 'job_seeker' ? 'I\'m a Job Seeker' : 'I\'m an Employer'}
            </button>
          ))}
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
            <label htmlFor="reg-name" className="label">Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(var(--color-text-faint))' }} />
              <input
                id="reg-name"
                type="text"
                className="input pl-10"
                placeholder="Your full name"
                value={form.full_name}
                onChange={set('full_name')}
                required
                autoComplete="name"
              />
            </div>
          </div>

          <div>
            <label htmlFor="reg-username" className="label">Username</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(var(--color-text-faint))' }} />
              <input
                id="reg-username"
                type="text"
                className="input pl-10"
                placeholder="Choose a username (min. 3 characters)"
                value={form.username}
                onChange={set('username')}
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label htmlFor="reg-email" className="label">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(var(--color-text-faint))' }} />
              <input
                id="reg-email"
                type="email"
                className="input pl-10"
                placeholder="you@example.com"
                value={form.email}
                onChange={set('email')}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="reg-municipality" className="label">Municipality</label>
              <select
                id="reg-municipality"
                className="input select"
                value={form.municipality}
                onChange={set('municipality')}
                required
              >
                <option value="">Select…</option>
                {MUNICIPALITIES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="reg-phone" className="label">Phone <span style={{ color: 'hsl(var(--color-text-faint))' }}>(optional)</span></label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(var(--color-text-faint))' }} />
                <input
                  id="reg-phone"
                  type="tel"
                  className="input pl-10"
                  placeholder="09xx-xxx-xxxx"
                  value={form.phone_number}
                  onChange={set('phone_number')}
                  autoComplete="tel"
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="reg-password" className="label">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(var(--color-text-faint))' }} />
              <input
                id="reg-password"
                type={showPw ? 'text' : 'password'}
                className="input pl-10 pr-10"
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={set('password')}
                required
                minLength={8}
                autoComplete="new-password"
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
            <p className="text-xs mt-1" style={{ color: 'hsl(var(--color-text-faint))' }}>
              Must include uppercase, lowercase, number, and special character
            </p>
          </div>

          <div>
            <label htmlFor="reg-confirm-pw" className="label">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(var(--color-text-faint))' }} />
              <input
                id="reg-confirm-pw"
                type={showPw ? 'text' : 'password'}
                className="input pl-10"
                placeholder="Repeat your password"
                value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
          </div>

          <button
            id="btn-register-submit"
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full py-3.5 text-base font-bold rounded-xl"
          >
            {loading ? <Spinner size="sm" /> : 'Create Account'}
          </button>

          <p className="text-center text-xs" style={{ color: 'hsl(var(--color-text-faint))' }}>
            By registering, you agree to our{' '}
            <Link to="/terms" className="underline">Terms of Service</Link>{' '}
            and{' '}
            <Link to="/privacy" className="underline">Privacy Policy</Link>.
          </p>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: 'hsl(var(--color-text-muted))' }}>
          Already have an account?{' '}
          <Link to="/login" id="link-to-login" className="font-semibold" style={{ color: 'hsl(var(--color-primary))' }}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
