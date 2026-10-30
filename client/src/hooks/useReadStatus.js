import { useEffect, useRef } from 'react';
import { markConversationRead } from '../services/chatApi';
import { isOwnMessage } from '../utils/messages';

/**
 * Marks a conversation as read while it is open and the tab is visible,
 * whenever a new message from the other side appears.
 */
export function useReadStatus(conversationId, messages, viewer, { onMarked, enabled = true } = {}) {
  const lastMarkedRef = useRef(null);
  const onMarkedRef = useRef(onMarked);
  useEffect(() => {
    onMarkedRef.current = onMarked;
  }, [onMarked]);

  let latestIncomingId = null;
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const m = messages[i];
    if (m.id && !isOwnMessage(m, viewer)) {
      latestIncomingId = m.id;
      break;
    }
  }

  useEffect(() => {
    lastMarkedRef.current = null;
  }, [conversationId]);

  useEffect(() => {
    if (!enabled || !conversationId || !latestIncomingId) return undefined;
    let timer = null;

    const mark = () => {
      if (document.visibilityState !== 'visible' || lastMarkedRef.current === latestIncomingId) return;
      clearTimeout(timer);
      timer = setTimeout(async () => {
        try {
          await markConversationRead(conversationId);
          lastMarkedRef.current = latestIncomingId;
          onMarkedRef.current?.(conversationId);
        } catch (error) {
          console.warn('[read-status] could not update read state:', error.message);
        }
      }, 400);
    };

    mark();
    document.addEventListener('visibilitychange', mark);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', mark);
    };
  }, [conversationId, latestIncomingId, enabled]);
}
