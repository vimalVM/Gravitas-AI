import { CloudOff, RefreshCw } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

/** Shown when the device is offline or live updates are reconnecting. */
export default function ConnectionBanner({ connection }) {
  const online = useOnlineStatus();
  if (online && connection !== 'reconnecting') return null;

  return (
    <div role="status" className="flex items-center justify-center gap-2 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
      {online ? <RefreshCw className="size-3.5 animate-spin" aria-hidden="true" /> : <CloudOff className="size-3.5" aria-hidden="true" />}
      {online
        ? 'Reconnecting to live updates...'
        : "You're offline. Messages you send will be retried when you reconnect."}
    </div>
  );
}
