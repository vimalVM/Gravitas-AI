import { ArrowLeft, Info } from 'lucide-react';

/** Conversation header: identity, live status, project context and an info button. */
export default function ChatHeader({ avatar, title, status, subtitle, badges, onBack, onInfo, infoLabel = 'Conversation details' }) {
  return (
    <header className="flex items-center gap-3 border-b border-slate-200 bg-white/95 px-3 py-2.5 pt-safe backdrop-blur sm:px-4">
      {onBack && (
        <button type="button" onClick={onBack} className="-ml-1 rounded-full p-2 text-slate-600 hover:bg-slate-100 md:hidden" aria-label="Back to conversations">
          <ArrowLeft className="size-5" />
        </button>
      )}
      {avatar}
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="truncate text-[15px] font-bold text-navy-900">{title}</h2>
          {badges}
        </div>
        <p className="flex min-w-0 items-center gap-1.5 text-xs text-slate-500">
          {status}
          {status && subtitle && (
            <span aria-hidden="true" className="text-slate-300">•</span>
          )}
          {subtitle && <span className="truncate">{subtitle}</span>}
        </p>
      </div>
      {onInfo && (
        <button type="button" onClick={onInfo} className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-navy-900" aria-label={infoLabel} title={infoLabel}>
          <Info className="size-5" />
        </button>
      )}
    </header>
  );
}

/** "Online" / "Offline" / "typing..." line used in chat headers. */
export function PresenceText({ online, typing }) {
  if (typing) return <span className="font-semibold text-blue-600">typing...</span>;
  return (
    <span className="inline-flex shrink-0 items-center gap-1">
      <span className={`size-2 rounded-full ${online ? 'bg-emerald-500' : 'bg-slate-300'}`} aria-hidden="true" />
      {online ? 'Online' : 'Offline'}
    </span>
  );
}
