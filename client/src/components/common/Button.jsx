import { Spinner } from './States';

const VARIANTS = {
  primary: 'bg-navy-900 text-white shadow-sm hover:bg-navy-800 focus-visible:ring-navy-400',
  accent: 'bg-blue-600 text-white shadow-sm hover:bg-blue-700 focus-visible:ring-blue-300',
  secondary: 'bg-white text-navy-900 ring-1 ring-slate-200 shadow-sm hover:bg-slate-50 focus-visible:ring-navy-300',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-navy-900 focus-visible:ring-navy-300',
  danger: 'bg-rose-600 text-white shadow-sm hover:bg-rose-700 focus-visible:ring-rose-300',
};

const SIZES = {
  sm: 'h-9 px-3 text-sm gap-1.5 rounded-xl',
  md: 'h-11 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-5 text-[15px] gap-2 rounded-2xl',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  children,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center font-semibold transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  );
}
