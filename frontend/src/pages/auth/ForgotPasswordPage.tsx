import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { authApi, extractError } from '../../api/client';
import { Spinner } from '../../components/ui';

type Step = 'email' | 'otp' | 'new-password' | 'done';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email) return;
    setError('');
    setLoading(true);
    try {
      await authApi.requestPasswordReset(email);
      setStep('otp');
      setResendCooldown(60);
    } catch {
      // Per spec: prevent account enumeration
      setStep('otp');
      setResendCooldown(60);
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

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = digits.join('');
    if (otp.length < 6) {
      setError('Please enter the full 6-digit code.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authApi.verifyResetCode(email, otp);
      setStep('new-password');
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    const otp = digits.join('');
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

  const stepNumber = step === 'email' ? 1 : step === 'otp' ? 2 : step === 'new-password' ? 3 : 4;
  const progressPercent = step === 'email' ? '25%' : step === 'otp' ? '50%' : step === 'new-password' ? '75%' : '100%';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-md">
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

        <div className="card p-6 sm:p-8 shadow-md border border-border bg-surface">
          {/* Step text and progress bar */}
          {step !== 'done' && (
            <>
              <div className="mb-2">
                <span className="text-xs font-semibold text-muted-foreground">
                  Step {stepNumber} of 3
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-muted mb-6 overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: progressPercent }}
                />
              </div>
            </>
          )}

          {step === 'done' ? (
            <div className="text-center py-4 animate-fade-in space-y-4">
              <div className="w-12 h-12 rounded-full bg-success/15 flex items-center justify-center mx-auto text-success">
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
                  Enter your registered email address and we will send you a 6-digit verification code.
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
                  className="input text-base sm:text-sm"
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
          ) : step === 'otp' ? (
            <form onSubmit={handleVerifyOtp} className="space-y-4 animate-fade-in">
              <div className="mb-4">
                <h1 className="text-2xl font-bold text-foreground mb-1">
                  Enter your code
                </h1>
                <p className="text-xs text-muted-foreground">
                  We sent a 6-digit verification code to <span className="font-semibold text-foreground">{email}</span>.
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

              <button
                id="btn-verify-otp"
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full py-3 text-xs font-bold rounded-xl mt-2"
              >
                {loading ? <Spinner size="sm" /> : 'Verify code'}
              </button>

              <div className="text-center space-y-2 pt-2">
                {resendCooldown > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Resend code in {resendCooldown}s
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleRequestOtp()}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Did not get it? <span className="font-semibold text-foreground underline">Send a new code</span>
                  </button>
                )}
                <div>
                  <Link to="/login" className="text-xs font-semibold text-foreground hover:underline">
                    Back to sign in
                  </Link>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4 animate-fade-in">
              <div className="mb-4">
                <h1 className="text-2xl font-bold text-foreground mb-1">
                  Create new password
                </h1>
                <p className="text-xs text-muted-foreground">
                  Your code has been verified. Enter a secure new password for your account.
                </p>
              </div>

              {error && (
                <div className="px-3 py-2.5 rounded-xl text-xs font-medium bg-danger/10 border border-danger/30 text-danger">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="new-password" className="label text-xs">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showPw ? 'text' : 'password'}
                    className="input text-base sm:text-sm pr-12"
                    placeholder="At least 8 characters"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    autoFocus
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
                <label htmlFor="confirm-password" className="label text-xs">
                  Confirm New Password
                </label>
                <input
                  id="confirm-password"
                  type={showPw ? 'text' : 'password'}
                  className="input text-base sm:text-sm"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <button
                id="btn-reset-password"
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full py-3 text-xs font-bold rounded-xl mt-2"
              >
                {loading ? <Spinner size="sm" /> : 'Reset password'}
              </button>

              <div className="text-center pt-2">
                <Link to="/login" className="text-xs font-semibold text-foreground hover:underline">
                  Back to sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
