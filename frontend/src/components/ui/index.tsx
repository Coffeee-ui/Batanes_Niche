import React, { useRef } from 'react';
import { Loader2 } from 'lucide-react';
import Modal from './Modal';
import CategoryIcon, { CategoryTile, CategoryBadge, getCategoryMeta } from './CategoryIcon';

export { Modal, CategoryIcon, CategoryTile, CategoryBadge, getCategoryMeta };
export type { ModalProps } from './Modal';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
  return (
    <Loader2
      className={`animate-spin ${sizes[size]} ${className}`}
      style={{ color: 'hsl(var(--primary))' }}
    />
  );
}

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-64 py-20">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading…</p>
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
    <div className="card flex flex-col items-center justify-center py-16 px-4 text-center my-4">
      {icon && (
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'hsl(var(--neutral-soft))' }}
        >
          <div style={{ color: 'hsl(var(--muted-foreground))' }}>{icon}</div>
        </div>
      )}
      <h3 className="text-lg font-bold mb-1.5" style={{ color: 'hsl(var(--foreground))' }}>
        {title}
      </h3>
      {description && (
        <p className="text-sm max-w-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
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

export function DashboardSkeleton() {
  return (
    <div className="container-page py-8 space-y-8 animate-pulse">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-6 h-28 space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-12" />
        </div>
        <div className="card p-6 h-28 space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-12" />
        </div>
        <div className="card p-6 h-28 space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-12" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-6 w-36" />
          <JobCardSkeleton />
          <JobCardSkeleton />
        </div>
        <div className="card p-6 space-y-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-2 w-full rounded-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function JobDetailSkeleton() {
  return (
    <div className="container-page py-8 space-y-6 animate-pulse">
      <Skeleton className="h-4 w-24" />
      <div className="card p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-8 w-3/4 max-w-md" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-11 w-36 rounded-xl" />
        </div>
        <div className="flex gap-2 pt-2 flex-wrap">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-32 rounded-full" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 card p-6 sm:p-8 space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-full" count={6} />
        </div>
        <div className="card p-6 space-y-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-full" count={4} />
        </div>
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
      className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl text-sm mb-4 bg-danger/10 border border-danger/25 text-danger"
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
  summaryCard?: {
    jobTitle?: string;
    employer?: string;
  };
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
  summaryCard,
  danger = false,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  const resolvedConfirmLabel = confirmLabel ?? (danger ? 'Yes, proceed' : 'Yes, continue');
  const resolvedCancelLabel = cancelLabel ?? (danger ? 'No, keep it' : 'No, go back');
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!loading) onCancel();
      }}
      title={title}
      titleId="confirm-dialog-title"
      descriptionId="confirm-dialog-desc"
      initialFocusRef={danger ? cancelBtnRef : confirmBtnRef}
      asBottomSheet
    >
      <p
        id="confirm-dialog-desc"
        className="text-sm leading-relaxed mb-4 text-muted-foreground"
      >
        {message}
      </p>

      {summaryCard && (
        <div
          className="rounded-xl p-3.5 mb-6 border"
          style={{
            backgroundColor: 'hsl(var(--neutral-soft))',
            borderColor: 'hsl(var(--border))',
          }}
        >
          {summaryCard.jobTitle && (
            <p className="font-bold text-sm text-foreground">
              {summaryCard.jobTitle}
            </p>
          )}
          {summaryCard.employer && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {summaryCard.employer}
            </p>
          )}
        </div>
      )}

      {/* Mobile (< md): stacked full-width buttons (confirm first, then cancel) */}
      <div className="flex md:hidden flex-col gap-2.5 mt-6 w-full">
        <button
          ref={danger ? undefined : confirmBtnRef}
          id="btn-modal-confirm-mobile"
          type="button"
          className={`btn w-full text-sm py-3 font-bold rounded-xl min-h-[44px] ${
            danger ? 'btn-danger' : 'btn-primary'
          }`}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? <Spinner size="sm" /> : resolvedConfirmLabel}
        </button>
        <button
          ref={danger ? cancelBtnRef : undefined}
          id="btn-modal-cancel-mobile"
          type="button"
          className="btn btn-secondary w-full text-sm py-3 font-semibold rounded-xl min-h-[44px]"
          onClick={onCancel}
          disabled={loading}
        >
          {resolvedCancelLabel}
        </button>
      </div>

      {/* Desktop (>= md): right-aligned side by side (cancel first, then confirm) */}
      <div className="hidden md:flex gap-3 justify-end items-center mt-6">
        <button
          ref={danger ? cancelBtnRef : undefined}
          id="btn-modal-cancel"
          type="button"
          className="btn btn-secondary text-sm px-5 py-2.5 min-h-[44px]"
          onClick={onCancel}
          disabled={loading}
        >
          {resolvedCancelLabel}
        </button>
        <button
          ref={danger ? undefined : confirmBtnRef}
          id="btn-modal-confirm"
          type="button"
          className={`btn text-sm px-5 py-2.5 min-h-[44px] ${
            danger ? 'btn-danger' : 'btn-primary'
          }`}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? <Spinner size="sm" /> : resolvedConfirmLabel}
        </button>
      </div>
    </Modal>
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
          {label && <span className="text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>{label}</span>}
          {showPercent && <span className="text-xs font-bold" style={{ color: 'hsl(var(--foreground))' }}>{pct}%</span>}
        </div>
      )}
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'hsl(var(--neutral-soft))' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: color || 'hsl(var(--tertiary-foreground))',
          }}
        />
      </div>
    </div>
  );
}

export { default as JobPreviewCard } from './JobPreviewCard';
