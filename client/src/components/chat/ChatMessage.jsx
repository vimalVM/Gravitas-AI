import { memo } from 'react';
import { Check, CircleAlert, Clock, RotateCcw, Trash2 } from 'lucide-react';
import { formatTime } from '../../utils/date';
import ImageMessage from './ImageMessage';

function StatusIcon({ status }) {
  if (status === 'sending') return <Clock className="size-3.5" aria-label="Sending" />;
  if (status === 'failed') return <CircleAlert className="size-3.5 text-rose-300" aria-label="Failed to send" />;
  return <Check className="size-3.5" aria-label="Sent" />;
}

/**
 * One chat bubble. Alignment comes from `own` (computed by comparing the
 * message sender with the signed-in account), never from the sender's role.
 */
function ChatMessage({ message, own, startsRun, senderLabel, avatar, onRetry, onDiscard, onOpenImage, onMediaLoad }) {
  const failed = message.status === 'failed';
  const bubble = own
    ? `bg-navy-900 text-white ${startsRun ? 'rounded-2xl rounded-tr-md' : 'rounded-2xl'}`
    : `bg-white text-slate-800 ring-1 ring-slate-200/80 ${startsRun ? 'rounded-2xl rounded-tl-md' : 'rounded-2xl'}`;

  return (
    <div className={`flex w-full animate-msg-in ${own ? 'justify-end' : 'justify-start'} ${startsRun ? 'mt-3' : 'mt-1'}`}>
      {!own && <div className="mr-2 w-8 shrink-0">{startsRun && avatar}</div>}

      <div className={`flex max-w-[85%] flex-col sm:max-w-[72%] ${own ? 'items-end' : 'items-start'}`}>
        {startsRun && senderLabel && (
          <span className={`mb-1 px-1 text-[11px] font-semibold ${own ? 'text-navy-500' : 'text-slate-500'}`}>{senderLabel}</span>
        )}

        <div className={`relative shadow-sm ${bubble} ${message.type === 'image' ? 'p-1.5' : 'px-3.5 py-2'} ${failed ? 'opacity-80' : ''}`}>
          {message.type === 'image' && <ImageMessage message={message} onOpen={onOpenImage} onLoad={onMediaLoad} />}
          {message.content && (
            <p className={`text-[15px] leading-relaxed break-words whitespace-pre-wrap [overflow-wrap:anywhere] ${message.type === 'image' ? 'px-2 pt-1.5' : ''}`}>
              {message.content}
            </p>
          )}
          <div
            className={`mt-0.5 flex items-center justify-end gap-1 text-[11px] ${own ? 'text-navy-200' : 'text-slate-400'} ${message.type === 'image' ? 'px-2 pb-0.5' : ''}`}
          >
            <time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time>
            {own && <StatusIcon status={message.status} />}
          </div>
        </div>

        {failed && (
          <div className="mt-1 flex flex-wrap items-center justify-end gap-2 text-xs">
            <span className="font-medium text-rose-600">{message.error || 'Not sent.'}</span>
            {message.retryable !== false && (
              <button type="button" onClick={() => onRetry?.(message.clientId)} className="inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 font-semibold text-navy-700 hover:bg-navy-50">
                <RotateCcw className="size-3.5" aria-hidden="true" /> Retry
              </button>
            )}
            <button type="button" onClick={() => onDiscard?.(message.clientId)} className="inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 font-semibold text-slate-500 hover:bg-slate-100">
              <Trash2 className="size-3.5" aria-hidden="true" /> Remove
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(ChatMessage);
