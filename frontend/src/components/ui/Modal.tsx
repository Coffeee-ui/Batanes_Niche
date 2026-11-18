import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  titleId?: string;
  descriptionId?: string;
  children: React.ReactNode;
  maxWidth?: string;
  asBottomSheet?: boolean; // Default true: bottom sheet on < md, centered dialog on >= md
  showCloseButton?: boolean;
  closeAriaLabel?: string;
  initialFocusRef?: React.RefObject<HTMLElement>;
  className?: string;
}

function isVisible(el: HTMLElement): boolean {
  return !!(
    el.offsetWidth ||
    el.offsetHeight ||
    el.getClientRects().length
  ) && window.getComputedStyle(el).visibility !== 'hidden';
}

export function Modal({
  isOpen,
  onClose,
  title,
  titleId = 'modal-title',
  descriptionId = 'modal-desc',
  children,
  maxWidth = 'max-w-md',
  asBottomSheet = true,
  showCloseButton = true,
  closeAriaLabel = 'Close dialog',
  initialFocusRef,
  className = '',
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Store latest callbacks in refs so effects don't re-run and steal focus on parent rerender
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const initialFocusRefRef = useRef(initialFocusRef);
  initialFocusRefRef.current = initialFocusRef;

  useEffect(() => {
    if (!isOpen) return;

    previousActiveElementRef.current = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Assign initial focus ONCE when modal transitions to open
    const focusTimer = setTimeout(() => {
      if (!dialogRef.current) return;

      if (initialFocusRefRef.current?.current) {
        initialFocusRefRef.current.current.focus();
        return;
      }

      // 1. Prefer explicit [autofocus] element
      const autoFocusEl = dialogRef.current.querySelector<HTMLElement>('[autofocus]');
      if (autoFocusEl && isVisible(autoFocusEl)) {
        autoFocusEl.focus();
        return;
      }

      // 2. Prefer first visible text input or textarea for form dialogs
      const firstInput = dialogRef.current.querySelector<HTMLElement>(
        'input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled])'
      );
      if (firstInput && isVisible(firstInput)) {
        firstInput.focus();
        return;
      }

      // 3. Fallback to first visible focusable element or the dialog container itself
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter(isVisible);

      if (focusable.length > 0) {
        focusable[0].focus();
      } else {
        dialogRef.current?.focus();
      }
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusableElements = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ).filter(isVisible);

        if (focusableElements.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement || !dialogRef.current.contains(document.activeElement)) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement || !dialogRef.current.contains(document.activeElement)) {
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
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex ${
        asBottomSheet
          ? 'items-end md:items-center justify-center p-0 md:p-4'
          : 'items-center justify-center p-4'
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={descriptionId}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={e => {
          e.stopPropagation();
          onCloseRef.current();
        }}
        aria-hidden="true"
      />

      {/* Modal/Sheet Content */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={`relative w-full ${maxWidth} bg-surface text-foreground shadow-2xl outline-none z-51 ${
          asBottomSheet
            ? 'rounded-t-3xl md:rounded-2xl p-6 max-h-[90dvh] overflow-y-auto animate-fade-in md:animate-scale-in pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] md:pb-6'
            : 'rounded-2xl p-6 max-h-[90dvh] overflow-y-auto animate-scale-in'
        } ${className}`}
        style={{
          backgroundColor: 'hsl(var(--surface))',
          border: '1px solid hsl(var(--border))',
          boxShadow: 'var(--shadow-lg)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Mobile Drag Handle */}
        {asBottomSheet && (
          <div className="flex md:hidden justify-center mb-3 -mt-1" aria-hidden="true">
            <div
              className="w-12 h-1.5 rounded-full"
              style={{ backgroundColor: 'hsl(var(--border))' }}
            />
          </div>
        )}

        {/* Header if title or close button */}
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between gap-3 mb-4">
            {title ? (
              <h2
                id={titleId}
                className="text-lg sm:text-xl font-bold tracking-tight text-foreground"
              >
                {title}
              </h2>
            ) : <div />}

            {showCloseButton && (
              <button
                type="button"
                onClick={() => onCloseRef.current()}
                className="inline-flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-neutral-soft/50 transition-colors -mr-2 -mt-2"
                aria-label={closeAriaLabel}
                style={{ width: '44px', height: '44px', minWidth: '44px', minHeight: '44px' }}
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}

export default Modal;
