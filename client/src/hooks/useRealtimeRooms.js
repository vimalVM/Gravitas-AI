import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { acquireRoom, broadcastTyping } from '../services/roomManager';

const TYPING_THROTTLE_MS = 2500;
const TYPING_TIMEOUT_MS = 5000;

/**
 * Presence (online status) and typing indicators for a set of conversations,
 * via private Realtime rooms protected by Realtime Authorization policies.
 *
 * Returns:
 *   online[conversationId] -> { user: boolean, ai_operator: boolean } for the OTHER participants
 *   typing[conversationId] -> role currently typing, or null
 *   available              -> false if rooms could not be joined (e.g. policies missing)
 *   sendTyping(conversationId, isTyping = true)
 */
export function useRealtimeRooms(conversationIds, viewer) {
  const [online, setOnline] = useState({});
  const [typing, setTyping] = useState({});
  const [available, setAvailable] = useState(true);
  const typingTimers = useRef(new Map());
  const lastTypingSent = useRef(new Map());

  const idsKey = useMemo(() => [...new Set(conversationIds.filter(Boolean))].sort().join(','), [conversationIds]);
  const viewerId = viewer?.id;
  const viewerRole = viewer?.role;

  useEffect(() => {
    if (!viewerId || !idsKey) return undefined;
    const me = { id: viewerId, role: viewerRole };
    const timers = typingTimers.current;

    const releases = idsKey.split(',').map((id) =>
      acquireRoom(id, me, (event) => {
        if (event.type === 'presence') {
          setOnline((prev) => ({ ...prev, [id]: event.roles }));
        } else if (event.type === 'typing') {
          clearTimeout(timers.get(id));
          setTyping((prev) => ({ ...prev, [id]: event.typing ? event.role : null }));
          if (event.typing) {
            timers.set(id, setTimeout(() => setTyping((prev) => ({ ...prev, [id]: null })), TYPING_TIMEOUT_MS));
          }
        } else if (event.type === 'status') {
          if (event.status === 'SUBSCRIBED') setAvailable(true);
          else if (event.status === 'CHANNEL_ERROR') setAvailable(false);
        }
      }),
    );

    return () => {
      releases.forEach((release) => release());
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, [idsKey, viewerId, viewerRole]);

  const sendTyping = useCallback(
    (conversationId, isTyping = true) => {
      if (!conversationId || !viewerId) return;
      const now = Date.now();
      const last = lastTypingSent.current.get(conversationId) ?? 0;
      if (isTyping && now - last < TYPING_THROTTLE_MS) return;
      if (!isTyping && last === 0) return;
      lastTypingSent.current.set(conversationId, isTyping ? now : 0);
      broadcastTyping(conversationId, { id: viewerId, role: viewerRole }, isTyping);
    },
    [viewerId, viewerRole],
  );

  return { online, typing, available, sendTyping };
}
