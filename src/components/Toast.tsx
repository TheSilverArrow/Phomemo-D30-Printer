import React, { useEffect } from 'react';

export interface ToastMessage {
  id: string;
  type: 'error' | 'success' | 'info';
  title?: string;
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        onDismiss(toasts[0].id);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toasts, onDismiss]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isError = toast.type === 'error';
        const isSuccess = toast.type === 'success';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl border shadow-xl flex items-start justify-between gap-3 text-sm transition-all duration-200 ${
              isError
                ? 'bg-rose-950/90 border-rose-800 text-rose-100'
                : isSuccess
                ? 'bg-emerald-950/90 border-emerald-800 text-emerald-100'
                : 'bg-neutral-900/90 border-neutral-800 text-neutral-100'
            }`}
          >
            <div className="space-y-0.5">
              {toast.title && <div className="font-semibold text-xs tracking-wide">{toast.title}</div>}
              <div className="text-xs leading-relaxed opacity-90">{toast.message}</div>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-xs opacity-60 hover:opacity-100 p-0.5"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
};
