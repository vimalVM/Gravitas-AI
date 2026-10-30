import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function FormField({ label, error, type = 'text', hint, className = '', ...inputProps }) {
  const id = useId();
  const [reveal, setReveal] = useState(false);
  const isPassword = type === 'password';
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-navy-900">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={isPassword && reveal ? 'text' : type}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={`h-12 w-full rounded-xl border bg-white px-3.5 text-[15px] text-slate-800 shadow-sm transition placeholder:text-slate-400 focus:ring-4 focus:outline-none ${isPassword ? 'pr-11' : ''} ${error ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100' : 'border-slate-300 focus:border-navy-400 focus:ring-navy-100'}`}
          {...inputProps}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            className="absolute inset-y-0 right-1 my-auto flex size-10 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600"
            aria-label={reveal ? 'Hide password' : 'Show password'}
          >
            {reveal ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-rose-600">{error}</p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}
