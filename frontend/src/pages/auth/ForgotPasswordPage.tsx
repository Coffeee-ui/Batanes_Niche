import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { authApi, extractError } from '../../api/client';
import { Spinner } from '../../components/ui';

type Step = 'email' | 'otp' | 'done';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.requestPasswordReset(email);
      setStep('otp');
    } catch {
      // Per spec: prevent account enumeration
      setStep('otp');
    } finally {
      setLoading(false);
    }
  };

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...digits];
    next[index] = value.slice(-1);
    setDigits(next);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = [...digits];
    for (let i = 0; i < 6; i++) {
      next[i] = pasted[i] || '';
    }
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = digits.join('');
    if (otp.length < 6) {
      setError('Please enter the full 6-digit code.');
      return;
    }
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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="card p-8 shadow-md">
          {/* Step text and progress bar */}
          <div className="mb-2">
            <span className="text-xs font-semibold text-muted-foreground">
              {step === 'email' ? 'Step 1 of 3' : step === 'otp' ? 'Step 2 of 3' : 'Step 3 of 3'}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-neutral-soft mb-6 overflow-hidden">
            <div
              className="h-full bg-tertiary transition-all duration-300"
              style={{
                width: step === 'email' ? '33%' : step === 'otp' ? '66%' : '100%',
              }}
            />
          </div>

          {step === 'done' ? (
            <div className="text-center py-4 animate-fade-in space-y-4">
              <div className="w-12 h-12 rounded-full bg-tertiary-soft flex items-center justify-center mx-auto text-tertiary">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                Password updated
              </h2>
              <p className="text-xs text-muted-foreground">
                Your password has been reset successfully. You can now sign in with your new credentials.
              </p>
              <Link
                to="/login"
                id="btn-back-to-login"
                className="btn btn-primary w-full py-3 text-xs font-bold rounded-xl mt-4"
              >
                Back to sign in
              </Link>
            </div>
          ) : step === 'email' ? (
            <form onSubmit={handleRequestOtp} className="space-y-4 animate-fade-in">
              <div className="mb-4">
                <h1 className="text-2xl font-bold text-foreground mb-1">
                  Reset password
                </h1>
                <p className="text-xs text-muted-foreground">
                  Enter your email address and we will send you a verification code.
                </p>
              </div>

              {error && (
                <div className="px-3 py-2.5 rounded-xl text-xs font-medium bg-danger/10 border border-danger/30 text-danger">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="forgot-email" className="label text-xs">
                  Email address
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  className="input text-sm"
                  placeholder="name@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <button
                id="btn-send-otp"
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full py-3 text-xs font-bold rounded-xl mt-2"
              >
                {loading ? <Spinner size="sm" /> : 'Send code'}
              </button>

              <div className="text-center pt-2">
                <Link to="/login" className="text-xs font-semibold text-foreground hover:underline">
                  Back to sign in
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleConfirm} className="space-y-4 animate-fade-in">
              <div className="mb-4">
                <h1 className="text-2xl font-bold text-foreground mb-1">
                  Enter your code
                </h1>
                <p className="text-xs text-muted-foreground">
                  We sent a 6-digit code to your email. Type it below.
                </p>
              </div>

              {error && (
                <div className="px-3 py-2.5 rounded-xl text-xs font-medium bg-danger/10 border border-danger/30 text-danger">
                  {error}
                </div>
              )}

              {/* 6-digit input boxes */}
              <div className="flex justify-between gap-2 my-4" onPaste={handlePaste}>
                {digits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => (inputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className="w-12 h-14 text-center text-lg font-bold rounded-xl input border-border focus:border-primary"
                    value={digit}
                    onChange={e => handleDigitChange(idx, e.target.value)}
                    onKeyDown={e => handleKeyDown(idx, e)}
                    autoFocus={idx === 0}
                  />
                ))}
              </div>

              <div>
                <label htmlFor="new-password" className="label text-xs">
                  New Password
                </label>
                <input
                  id="new-password"
                  type="password"
                  className="input text-sm"
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>

              <button
                id="btn-verify-otp"
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full py-3 text-xs font-bold rounded-xl mt-2"
              >
                {loading ? <Spinner size="sm" /> : 'Verify code'}
              </button>

              <div className="text-center space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Did not get it? <span className="font-semibold text-foreground underline">Send a new code</span>
                </button>
                <div>
                  <Link to="/login" className="text-xs font-semibold text-foreground hover:underline">
                    Back to sign in
                  </Link>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
