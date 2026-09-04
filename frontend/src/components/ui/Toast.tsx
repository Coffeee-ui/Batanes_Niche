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
    success: <CheckCircle className="w-4 h-4 shrink-0" style={{ color: 'hsl(var(--color-success))' }} />,
    error: <AlertCircle className="w-4 h-4 shrink-0" style={{ color: 'hsl(var(--color-danger))' }} />,
    info: <Info className="w-4 h-4 shrink-0" style={{ color: 'hsl(var(--color-primary))' }} />,
  };

  const borders = {
    success: 'hsl(var(--color-success))',
    error: 'hsl(var(--color-danger))',
    info: 'hsl(var(--color-primary))',
  };

  return (
    <div
      aria-live="assertive"
      className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none"
    >
      {toasts.map(t => (
        <div
          key={t.id}
          className="toast-enter pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl max-w-sm"
          role="alert"
          style={{
            background: 'hsl(var(--color-surface))',
            border: `1px solid hsl(var(--color-border))`,
            borderLeft: `4px solid ${borders[t.type]}`,
            boxShadow: 'var(--shadow-lg)',
            minWidth: '280px',
          }}
        >
          {icons[t.type]}
          <p className="text-sm flex-1" style={{ color: 'hsl(var(--color-text))' }}>{t.message}</p>
          <button
            onClick={() => remove(t.id)}
            className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" style={{ color: 'hsl(var(--color-text-muted))' }} />
          </button>
        </div>
      ))}
    </div>
  );
}
