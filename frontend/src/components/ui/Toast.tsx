import React, { useEffect, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

let addToastFn: ((msg: string, type: ToastType) => void) | null = null;

export function toast(message: string, type: ToastType = 'info') {
  if (addToastFn) addToastFn(message, type);
}
export const toastSuccess = (msg: string) => toast(msg, 'success');
export const toastError = (msg: string) => toast(msg, 'error');
export const toastInfo = (msg: string) => toast(msg, 'info');

export default function ToastProvider() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const add = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  useEffect(() => {
    addToastFn = add;
    return () => { addToastFn = null; };
  }, [add]);

  const remove = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  const icons = {
    success: <CheckCircle className="w-4 h-4 shrink-0 text-tertiary" />,
    // STYLE-01: use --color-danger (exists) instead of --danger (does not)
    error: <AlertCircle className="w-4 h-4 shrink-0" style={{ color: 'hsl(var(--color-danger))' }} />,
    info: <Info className="w-4 h-4 shrink-0 text-primary" />,
  };

  const borders = {
    success: 'hsl(var(--tertiary-foreground))',
    error: 'hsl(var(--color-danger))',   // STYLE-01 fix
    info: 'hsl(var(--primary))',
  };

  if (toasts.length === 0) return null;

  return (
    <>
      {/* Desktop: bottom-right stack */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="hidden md:flex fixed bottom-6 right-6 z-[9999] flex-col gap-3 pointer-events-none"
      >
        {toasts.map(t => (
          <div
            key={t.id}
            className="toast-enter pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-2xl max-w-sm"
            role={t.type === 'error' ? 'alert' : 'status'}
            aria-live={t.type === 'error' ? 'assertive' : 'polite'}
            style={{
              backgroundColor: 'hsl(var(--surface))',
              border: `1px solid hsl(var(--border))`,
              borderLeft: `4px solid ${borders[t.type]}`,
              boxShadow: 'var(--shadow-lg)',
              minWidth: '280px',
            }}
          >
            {icons[t.type]}
            <p className="text-sm flex-1 text-foreground">{t.message}</p>
            <button
              onClick={() => remove(t.id)}
              className="shrink-0 opacity-50 hover:opacity-100 transition-opacity text-muted-foreground flex items-center justify-center"
              aria-label="Dismiss notification"
              style={{ minWidth: '44px', minHeight: '44px' }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Mobile: full-width stack at top */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="flex md:hidden fixed top-0 left-0 right-0 z-[9999] flex-col gap-0 pointer-events-none"
      >
        {toasts.map(t => (
          <div
            key={t.id}
            className="toast-enter pointer-events-auto flex items-start gap-3 px-4 py-3 w-full"
            role={t.type === 'error' ? 'alert' : 'status'}
            aria-live={t.type === 'error' ? 'assertive' : 'polite'}
            style={{
              backgroundColor: 'hsl(var(--surface))',
              borderBottom: `1px solid hsl(var(--border))`,
              borderLeft: `4px solid ${borders[t.type]}`,
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            {icons[t.type]}
            <p className="text-sm flex-1 text-foreground">{t.message}</p>
            <button
              onClick={() => remove(t.id)}
              className="shrink-0 opacity-50 hover:opacity-100 transition-opacity text-muted-foreground flex items-center justify-center"
              aria-label="Dismiss notification"
              style={{ minWidth: '44px', minHeight: '44px' }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
