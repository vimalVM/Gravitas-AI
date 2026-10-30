import { CircleAlert, LoaderCircle, RefreshCw, X } from 'lucide-react';
import Logo from '../brand/Logo';

export function Spinner({ className = 'size-5' }) {
  return <LoaderCircle className={`animate-spin ${className}`} aria-hidden="true" />;
}

export function LoadingState({ label = 'Loading...', fullScreen = false, className = '' }) {
  return (
    <div
      role="status"
      className={`flex flex-col items-center justify-center gap-3 text-slate-500 ${fullScreen ? 'min-h-dvh' : 'py-12'} ${className}`}
    >
      {fullScreen ? <Logo size={44} className="animate-pulse" /> : <Spinner className="size-6 text-navy-600" />}
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center px-6 py-10 text-center ${className}`}>
      {Icon && (
        <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-white text-navy-600 shadow-sm ring-1 ring-slate-200">
          <Icon className="size-6" aria-hidden="true" />
        </span>
      )}
      <h3 className="text-base font-bold text-navy-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorBanner({ title = 'Something went wrong', message, onRetry, onDismiss, className = '' }) {
  return (
    <div role="alert" className={`flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-rose-800 ${className}`}>
      <CircleAlert className="mt-0.5 size-5 shrink-0 text-rose-600" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        {message && <p className="mt-0.5 text-sm text-rose-700">{message}</p>}
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100"
          >
            <RefreshCw className="size-3.5" aria-hidden="true" /> Try again
          </button>
        )}
      </div>
      {onDismiss && (
        <button type="button" onClick={onDismiss} className="rounded-lg p-1 text-rose-500 hover:bg-rose-100" aria-label="Dismiss">
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
