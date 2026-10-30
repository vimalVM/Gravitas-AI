import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, MessagesSquare } from 'lucide-react';
import { buildMessageRows, messageKey } from '../../utils/messages';
import { EmptyState, ErrorBanner, LoadingState, Spinner } from '../common/States';
import ChatMessage from './ChatMessage';
import ImageLightbox from './ImageLightbox';

const NEAR_BOTTOM_PX = 140;

function DateSeparator({ label }) {
  return (
    <div className="sticky top-2 z-10 my-4 flex justify-center" role="separator" aria-label={label}>
      <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-slate-500 shadow-sm ring-1 ring-slate-200 backdrop-blur">
        {label}
      </span>
    </div>
  );
}

export function TypingIndicator({ label, avatar }) {
  return (
    <div className="mt-3 flex animate-msg-in items-end gap-2" aria-live="polite">
      <div className="w-8 shrink-0">{avatar}</div>
      <div className="rounded-2xl rounded-tl-md bg-white px-3.5 py-2.5 shadow-sm ring-1 ring-slate-200/80">
        <span className="sr-only">{label} is typing</span>
        <span className="flex items-center gap-1" aria-hidden="true">
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </span>
      </div>
    </div>
  );
}

/**
 * Scrollable message history. Sticks to the bottom only when the reader is
 * already near it; keeps position when older messages are prepended.
 */
export default function ChatMessageList({
  chat,
  viewer,
  labelFor,
  avatarFor,
  typingLabel,
  typingAvatar,
  emptyTitle = 'No messages yet',
  emptyDescription = 'Say hello to start the conversation.',
  startNotice = 'Beginning of the conversation',
}) {
  const { items, status, error, hasMore, loadingOlder, loadOlder, reload, retry, discard } = chat;
  const scrollRef = useRef(null);
  const topSentinelRef = useRef(null);
  const nearBottomRef = useRef(true);
  const snapshotRef = useRef({ firstKey: null, lastKey: null, scrollHeight: 0, count: 0 });
  const [showJump, setShowJump] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState(null);

  const rows = useMemo(() => buildMessageRows(items, viewer), [items, viewer]);
  const firstKey = items[0] ? messageKey(items[0]) : null;
  const last = items[items.length - 1];
  const lastKey = last ? messageKey(last) : null;
  const lastIsOwn = rows.length ? rows[rows.length - 1].own : false;

  const scrollToBottom = useCallback((behavior = 'auto') => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior });
    setShowJump(false);
  }, []);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const prev = snapshotRef.current;

    if (prev.count === 0 && items.length > 0) {
      el.scrollTop = el.scrollHeight; // first render of this conversation
    } else if (firstKey !== prev.firstKey && lastKey === prev.lastKey) {
      el.scrollTop += el.scrollHeight - prev.scrollHeight; // older messages prepended
    } else if (lastKey !== prev.lastKey) {
      if (nearBottomRef.current || lastIsOwn) scrollToBottom(prev.count ? 'smooth' : 'auto');
      else setShowJump(true);
    }
    snapshotRef.current = { firstKey, lastKey, scrollHeight: el.scrollHeight, count: items.length };
  }, [firstKey, lastKey, items.length, lastIsOwn, scrollToBottom]);

  // Keep the typing indicator visible when it appears.
  useEffect(() => {
    if (typingLabel && nearBottomRef.current) scrollToBottom('smooth');
  }, [typingLabel, scrollToBottom]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    nearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
    snapshotRef.current.scrollHeight = el.scrollHeight;
    if (nearBottomRef.current) setShowJump(false);
  };

  // Images change the height after loading; stay pinned if we were at the bottom.
  const handleMediaLoad = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (nearBottomRef.current) el.scrollTop = el.scrollHeight;
    snapshotRef.current.scrollHeight = el.scrollHeight;
  }, []);

  // When the viewport shrinks (mobile keyboard, attachment preview), stay pinned to the latest message.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(() => {
      if (nearBottomRef.current) el.scrollTop = el.scrollHeight;
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Infinite scroll upwards.
  useEffect(() => {
    const sentinel = topSentinelRef.current;
    const root = scrollRef.current;
    if (!sentinel || !root || !hasMore) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadOlder()?.catch?.(() => {});
      },
      { root, rootMargin: '200px 0px 0px 0px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadOlder, status]);

  const openImage = useCallback((src) => setLightboxSrc(src), []);
  const closeImage = useCallback(() => setLightboxSrc(null), []);

  let body;
  if (status === 'loading' && !items.length) {
    body = <LoadingState label="Loading conversation..." />;
  } else if (status === 'error' && !items.length) {
    body = (
      <div className="mx-auto max-w-md py-10">
        <ErrorBanner title="Couldn't load messages" message={error?.message} onRetry={reload} />
      </div>
    );
  } else if (!items.length) {
    body = <EmptyState icon={MessagesSquare} title={emptyTitle} description={emptyDescription} className="h-full" />;
  } else {
    body = (
      <>
        <div ref={topSentinelRef} className="h-px" aria-hidden="true" />
        {hasMore && (
          <div className="flex justify-center py-2">
            {loadingOlder ? (
              <Spinner className="size-5 text-slate-400" />
            ) : (
              <button type="button" onClick={() => loadOlder()?.catch?.(() => {})} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-navy-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50">
                Load earlier messages
              </button>
            )}
          </div>
        )}
        {!hasMore && (
          <p className="mx-auto max-w-sm py-3 text-center text-[11px] leading-relaxed font-medium text-slate-400">{startNotice}</p>
        )}
        {rows.map((row) =>
          row.type === 'date' ? (
            <DateSeparator key={row.key} label={row.label} />
          ) : (
            <ChatMessage
              key={row.key}
              message={row.message}
              own={row.own}
              startsRun={row.startsRun}
              senderLabel={labelFor(row.message, row.own)}
              avatar={avatarFor(row.message, row.own)}
              onRetry={retry}
              onDiscard={discard}
              onOpenImage={openImage}
              onMediaLoad={handleMediaLoad}
            />
          ),
        )}
        {typingLabel && <TypingIndicator label={typingLabel} avatar={typingAvatar} />}
      </>
    );
  }

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="chat-surface scrollbar-thin absolute inset-0 overflow-x-hidden overflow-y-auto overscroll-contain"
        aria-label="Messages"
        role="log"
      >
        <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col justify-end px-3 pb-4 sm:px-6">{body}</div>
      </div>

      {showJump && (
        <button
          type="button"
          onClick={() => scrollToBottom('smooth')}
          className="absolute bottom-4 left-1/2 inline-flex -translate-x-1/2 animate-sheet-in items-center gap-1.5 rounded-full bg-navy-900 px-3.5 py-2 text-xs font-semibold text-white shadow-lg hover:bg-navy-800"
        >
          <ArrowDown className="size-4" aria-hidden="true" /> New messages
        </button>
      )}
      <ImageLightbox src={lightboxSrc} onClose={closeImage} />
    </div>
  );
}
