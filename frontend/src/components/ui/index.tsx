import React from 'react';
import { Loader2, X } from 'lucide-react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
  return (
    <Loader2
      className={`animate-spin ${sizes[size]} ${className}`}
      style={{ color: 'hsl(var(--color-primary))' }}
    />
  );
}

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-64 py-20">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm" style={{ color: 'hsl(var(--color-text-muted))' }}>Loading…</p>
      </div>
    </div>
  );
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && (
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'hsl(var(--color-bg-alt))' }}
        >
          <div style={{ color: 'hsl(var(--color-text-faint))' }}>{icon}</div>
        </div>
      )}
      <h3 className="text-lg font-semibold mb-2" style={{ color: 'hsl(var(--color-text))' }}>
        {title}
      </h3>
      {description && (
        <p className="text-sm max-w-sm" style={{ color: 'hsl(var(--color-text-muted))' }}>
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

interface SkeletonProps {
  className?: string;
  count?: number;
}

export function Skeleton({ className = 'h-4 w-full', count = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`skeleton ${className}`} />
      ))}
    </>
  );
}

export function JobCardSkeleton() {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-start justify-between">
        <Skeleton className="h-5 w-48 skeleton" />
        <Skeleton className="h-5 w-16 skeleton rounded-full" />
      </div>
      <Skeleton className="h-4 w-32 skeleton" />
      <Skeleton className="h-4 w-full skeleton" />
      <Skeleton className="h-4 w-3/4 skeleton" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-6 w-20 skeleton rounded-full" />
        <Skeleton className="h-6 w-20 skeleton rounded-full" />
      </div>
    </div>
  );
}

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div
      className="flex items-center justify-between gap-4 px-4 py-3 rounded-lg text-sm"
      style={{
        background: 'hsl(var(--color-danger) / 0.08)',
        border: '1px solid hsl(var(--color-danger) / 0.25)',
        color: 'hsl(var(--color-danger))',
      }}
    >
      <span>{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="font-semibold underline underline-offset-2 whitespace-nowrap">
          Retry
        </button>
      )}
    </div>
  );
}

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  danger?: boolean;
  loading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  danger = false,
  loading = false,
}: ConfirmDialogProps) {
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const previousActiveElementRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;

    // Save triggering element for focus restore
    previousActiveElementRef.current = document.activeElement as HTMLElement | null;

    // Lock background scrolling
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus inside modal
    const focusTimer = setTimeout(() => {
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable && focusable.length > 0) {
        focusable[0].focus();
      } else {
        dialogRef.current?.focus();
      }
    }, 50);

    // Escape key listener & focus trap
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (!loading) {
          onCancel();
        }
        return;
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === 'function') {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isOpen, loading, onCancel]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!loading) {
      onCancel();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
    >
      {/* Full-screen backdrop preventing background clicks */}
      <div
        className="fixed inset-0 transition-opacity bg-black/60 backdrop-blur-xs"
        style={{ pointerEvents: 'auto' }}
        onClick={handleBackdropClick}
      />

      {/* Modal Dialog Box */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative rounded-2xl p-6 w-full max-w-md animate-scale-in outline-none"
        style={{
          background: 'hsl(var(--color-surface))',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid hsl(var(--color-border-subtle))',
          pointerEvents: 'auto',
          zIndex: 51,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header with Title and visible Close (X) button */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <h2
            id="confirm-dialog-title"
            className="text-lg font-bold"
            style={{ color: 'hsl(var(--color-text))' }}
          >
            {title}
          </h2>
          <button
            onClick={onCancel}
            disabled={loading}
            className="p-1 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5 -mr-1 -mt-1 text-muted"
            aria-label="Close dialog"
            id="btn-modal-close-x"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message */}
        <p
          id="confirm-dialog-desc"
          className="text-sm leading-relaxed mb-6"
          style={{ color: 'hsl(var(--color-text-muted))' }}
        >
          {message}
        </p>

        {/* Actions */}
        <div className="flex gap-3 justify-end items-center">
          <button
            id="btn-modal-cancel"
            type="button"
            className="btn btn-secondary text-sm px-4 py-2"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            id="btn-modal-confirm"
            type="button"
            className={`btn text-sm px-4 py-2 ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <Spinner size="sm" /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  label?: string;
  showPercent?: boolean;
}

export function ProgressBar({ value, max = 100, color, label, showPercent }: ProgressBarProps) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div>
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-xs font-medium" style={{ color: 'hsl(var(--color-text-muted))' }}>{label}</span>}
          {showPercent && <span className="text-xs font-semibold" style={{ color: 'hsl(var(--color-text))' }}>{pct}%</span>}
        </div>
      )}
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'hsl(var(--color-border))' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: color || 'linear-gradient(90deg, hsl(var(--color-primary)), hsl(var(--color-secondary)))',
          }}
        />
      </div>
    </div>
  );
}

export { default as JobPreviewCard } from './JobPreviewCard';
