import { Users } from 'lucide-react';
import { GROUP } from '../../config/app';

/** "Group No. 27" as a small pill, or as the card from the sketch. */
export default function GroupBadge({ variant = 'pill', className = '' }) {
  if (variant === 'card') {
    return (
      <div className={`flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm ${className}`}>
        <span className="flex size-11 items-center justify-center rounded-full bg-navy-50 text-navy-700 ring-1 ring-navy-100">
          <Users className="size-5" aria-hidden="true" />
        </span>
        <div className="leading-tight">
          <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">Team</p>
          <p className="text-base font-bold text-navy-900">{GROUP.label}</p>
        </div>
      </div>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-navy-50 px-2 py-0.5 text-[11px] font-semibold text-navy-700 ring-1 ring-navy-100 ${className}`}
    >
      <Users className="size-3" aria-hidden="true" />
      {GROUP.label}
    </span>
  );
}
