import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import Button from './Button';

function useEscape(open, onClose) {
  useEffect(() => {
    if (!open) return undefined;
    const handler = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);
}

export function ConfirmationDialog({ open, title, description, confirmLabel = 'Confirm', cancelLabel = 'Cancel', tone = 'primary', loading, onConfirm, onCancel }) {
  const titleId = useId();
  const confirmRef = useRef(null);
  useEscape(open, onCancel);
  useEffect(() => {
    if (open) confirmRef.current?.focus();
  }, [open]);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div className="absolute inset-0 animate-fade-in bg-navy-950/40 backdrop-blur-[2px]" onClick={onCancel} aria-hidden="true" />
      <div role="alertdialog" aria-modal="true" aria-labelledby={titleId} className="relative w-full max-w-sm animate-sheet-in rounded-3xl bg-white p-6 shadow-2xl">
        <h2 id={titleId} className="text-lg font-bold text-navy-900">{title}</h2>
        {description && <p className="mt-2 text-sm text-slate-600">{description}</p>}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>{cancelLabel}</Button>
          <Button ref={confirmRef} variant={tone} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}

/** Side sheet on desktop, bottom sheet on mobile. */
export function Sheet({ open, title, onClose, children }) {
  const titleId = useId();
  useEscape(open, onClose);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-stretch sm:justify-end">
      <div className="absolute inset-0 animate-fade-in bg-navy-950/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex max-h-[85dvh] w-full animate-sheet-in flex-col rounded-t-3xl bg-slate-50 shadow-2xl sm:max-h-none sm:max-w-sm sm:rounded-none sm:rounded-l-3xl"
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 id={titleId} className="text-base font-bold text-navy-900">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-500 hover:bg-slate-200/70" aria-label="Close">
            <X className="size-5" />
          </button>
        </header>
        <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto p-5 pb-safe">{children}</div>
      </aside>
    </div>
  );
}
