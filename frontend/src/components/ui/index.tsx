import React from 'react';
import { Loader2 } from 'lucide-react';

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

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export function ConfirmDialog({
  isOpen, title, message, confirmLabel = 'Confirm',
  onConfirm, onCancel, danger
}: ConfirmDialogProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onCancel} />
      <div
        className="relative rounded-2xl p-6 w-full max-w-sm animate-scale-in"
        style={{ background: 'hsl(var(--color-surface))', boxShadow: 'var(--shadow-lg)' }}
      >
        <h2 className="text-lg font-bold mb-2" style={{ color: 'hsl(var(--color-text))' }}>{title}</h2>
        <p className="text-sm mb-6" style={{ color: 'hsl(var(--color-text-muted))' }}>{message}</p>
        <div className="flex gap-3 justify-end">
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button
            className={danger ? 'btn btn-danger' : 'btn btn-primary'}
            onClick={onConfirm}
          >
            {confirmLabel}
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
