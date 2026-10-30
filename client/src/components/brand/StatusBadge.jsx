import { PROJECT_STATUS } from '../../config/app';

export default function StatusBadge({ status, className = '' }) {
  const meta = PROJECT_STATUS[status] ?? PROJECT_STATUS.in_progress;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase ring-1 ring-inset ${meta.className} ${className}`}
    >
      <span className={`size-1.5 rounded-full ${meta.dot} ${status === 'in_progress' ? 'animate-pulse' : ''}`} aria-hidden="true" />
      {meta.label}
    </span>
  );
}
