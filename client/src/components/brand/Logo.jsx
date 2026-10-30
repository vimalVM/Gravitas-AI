import { APP } from '../../config/app';

/** Original Gravitas AI mark: a core with an orbiting satellite. */
export default function Logo({ size = 36, className = '', title = `${APP.assistantName} logo` }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" role="img" aria-label={title} className={`shrink-0 ${className}`}>
      <rect width="40" height="40" rx="12" fill="#16244a" />
      <ellipse cx="20" cy="20" rx="13" ry="6.5" fill="none" stroke="#9bb2dc" strokeWidth="1.8" transform="rotate(-28 20 20)" />
      <circle cx="20" cy="20" r="6" fill="#3b82f6" />
      <circle cx="31.5" cy="13.9" r="2.3" fill="#ffffff" />
    </svg>
  );
}

export function Wordmark({ className = '', light = false }) {
  return (
    <span className={`font-extrabold tracking-[0.16em] ${light ? 'text-white' : 'text-navy-900'} ${className}`}>
      GRAVITAS <span className={light ? 'text-blue-300' : 'text-blue-600'}>AI</span>
    </span>
  );
}

export function BrandMark({ size = 36, light = false, subtitle, className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Logo size={size} />
      <div className="min-w-0 leading-tight">
        <Wordmark light={light} className="block text-[15px]" />
        {subtitle && <span className={`block truncate text-xs ${light ? 'text-navy-200' : 'text-slate-500'}`}>{subtitle}</span>}
      </div>
    </div>
  );
}
