import { useCallback, useMemo, useRef, useState } from 'react';
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';
import { ToastContext } from './contexts';

const STYLES = {
  success: { icon: CircleCheck, accent: 'text-emerald-600' },
  error: { icon: CircleAlert, accent: 'text-rose-600' },
  info: { icon: Info, accent: 'text-blue-600' },
};

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    ({ type = 'info', title, message, duration = 4500 }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setToasts((list) => {
        // Avoid stacking identical notifications.
        const withoutDuplicate = list.filter((t) => !(t.title === title && t.message === message));
        return [...withoutDuplicate.slice(-3), { id, type, title, message }];
      });
      timers.current.set(id, setTimeout(() => dismiss(id), duration));
      return id;
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({
      notify,
      dismiss,
      success: (title, message) => notify({ type: 'success', title, message }),
      error: (title, message) => notify({ type: 'error', title, message, duration: 6500 }),
      info: (title, message) => notify({ type: 'info', title, message }),
    }),
    [notify, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 px-4 pt-safe sm:items-end sm:pr-6"
      >
        <div className="h-3" />
        {toasts.map((toast) => {
          const { icon: Icon, accent } = STYLES[toast.type] ?? STYLES.info;
          return (
            <div
              key={toast.id}
              role={toast.type === 'error' ? 'alert' : 'status'}
              className="pointer-events-auto flex w-full max-w-sm animate-sheet-in items-start gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3.5 shadow-lg shadow-navy-900/10 backdrop-blur"
            >
              <Icon className={`mt-0.5 size-5 shrink-0 ${accent}`} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-navy-900">{toast.title}</p>
                {toast.message && <p className="mt-0.5 text-sm text-slate-600">{toast.message}</p>}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Dismiss notification"
              >
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
