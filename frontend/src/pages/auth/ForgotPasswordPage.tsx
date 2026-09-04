import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Mail, KeyRound, Lock, CheckCircle } from 'lucide-react';
import { authApi, extractError } from '../../api/client';
import { Spinner } from '../../components/ui';

type Step = 'email' | 'otp' | 'done';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.requestPasswordReset(email);
      setStep('otp');
    } catch (err) {
      // Per spec: always show success message to prevent account enumeration
      setStep('otp');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.confirmPasswordReset(email, otp, newPassword);
      setStep('done');
    } catch (err) {
      setError(extractError(err));
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
        </div>

        <div
          className="rounded-2xl p-6"
          style={{
            background: 'hsl(var(--color-surface))',
            border: '1px solid hsl(var(--color-border-subtle))',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {step === 'done' ? (
            <div className="text-center py-6 animate-fade-in">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'hsl(var(--color-success) / 0.1)' }}
              >
                <CheckCircle className="w-8 h-8" style={{ color: 'hsl(var(--color-success))' }} />
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ color: 'hsl(var(--color-text))' }}>
                Password Reset!
              </h2>
              <p className="text-sm mb-6" style={{ color: 'hsl(var(--color-text-muted))' }}>
                Your password has been updated. You can now sign in.
              </p>
              <Link to="/login" id="btn-back-to-login" className="btn btn-primary">
                Sign In Now
              </Link>
            </div>
          ) : step === 'email' ? (
            <form onSubmit={handleRequestOtp} className="space-y-4 animate-fade-in">
              <div className="text-center mb-6">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'hsl(var(--color-primary) / 0.1)' }}
                >
                  <Mail className="w-6 h-6" style={{ color: 'hsl(var(--color-primary))' }} />
                </div>
                <h1 className="text-xl font-bold mb-1" style={{ color: 'hsl(var(--color-text))' }}>
                  Reset Password
                </h1>
                <p className="text-sm" style={{ color: 'hsl(var(--color-text-muted))' }}>
                  Enter your email and we'll send a 6-digit OTP
                </p>
              </div>
              <div>
                <label htmlFor="forgot-email" className="label">Email Address</label>
                <input
                  id="forgot-email"
                  type="email"
                  className="input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <button id="btn-request-otp" type="submit" disabled={loading} className="btn btn-primary w-full py-3.5">
                {loading ? <Spinner size="sm" /> : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleConfirm} className="space-y-4 animate-fade-in">
              <div className="text-center mb-6">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'hsl(var(--color-primary) / 0.1)' }}
                >
                  <KeyRound className="w-6 h-6" style={{ color: 'hsl(var(--color-primary))' }} />
                </div>
                <h1 className="text-xl font-bold mb-1" style={{ color: 'hsl(var(--color-text))' }}>
                  Enter OTP
                </h1>
                <p className="text-sm" style={{ color: 'hsl(var(--color-text-muted))' }}>
                  Check your email for the 6-digit code sent to <strong>{email}</strong>
                </p>
              </div>

              {error && (
                <div
                  className="px-4 py-3 rounded-lg text-sm"
                  style={{ background: 'hsl(var(--color-danger) / 0.08)', border: '1px solid hsl(var(--color-danger) / 0.25)', color: 'hsl(var(--color-danger))' }}
                >
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="otp-code" className="label">6-Digit OTP</label>
                <input
                  id="otp-code"
                  type="text"
                  className="input text-center text-xl font-mono tracking-widest"
                  placeholder="000000"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength={6}
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="new-password" className="label">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(var(--color-text-faint))' }} />
                  <input
                    id="new-password"
                    type="password"
                    className="input pl-10"
                    placeholder="Min. 8 characters"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
              </div>
              <button id="btn-confirm-reset" type="submit" disabled={loading || otp.length !== 6} className="btn btn-primary w-full py-3.5">
                {loading ? <Spinner size="sm" /> : 'Reset Password'}
              </button>
              <button type="button" onClick={() => setStep('email')} className="btn btn-ghost w-full">
                ← Back
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm mt-6" style={{ color: 'hsl(var(--color-text-muted))' }}>
          Remember your password?{' '}
          <Link to="/login" className="font-semibold" style={{ color: 'hsl(var(--color-primary))' }}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
