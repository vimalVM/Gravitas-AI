import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  discardMessage,
  fetchNewerMessages,
  ingestMessages,
  loadInitialMessages,
  loadOlderMessages,
  messageStore,
  retryMessage,
  retryOfflineMessages,
  sendMessage,
} from '../services/messageStore';
import { createUuid } from '../utils/ids';
import { normalizeMessage } from '../utils/messages';

const noopSubscribe = () => () => {};
const EMPTY_SNAPSHOT = messageStore.get(null);

/**
 * Loads a conversation's messages, keeps them live with Supabase Realtime,
 * and exposes send / retry / pagination actions.
 *
 * connection: 'connecting' | 'live' | 'reconnecting'
 */
export function useConversationMessages(conversationId, viewer, { onIncoming } = {}) {
  const subscribe = useCallback(
    (listener) => (conversationId ? messageStore.subscribe(conversationId, listener) : noopSubscribe()),
    [conversationId],
  );
  const getSnapshot = useCallback(
    () => (conversationId ? messageStore.get(conversationId) : EMPTY_SNAPSHOT),
    [conversationId],
  );
  const state = useSyncExternalStore(subscribe, getSnapshot);
  const [connection, setConnection] = useState('connecting');

  const onIncomingRef = useRef(onIncoming);
  useEffect(() => {
    onIncomingRef.current = onIncoming;
  }, [onIncoming]);

  // Initial load (or catch up when reopening a cached conversation).
  useEffect(() => {
    if (!conversationId) return;
    if (messageStore.get(conversationId).loaded) fetchNewerMessages(conversationId);
    else loadInitialMessages(conversationId);
  }, [conversationId]);

  // Realtime: new rows in this conversation. RLS decides who receives them.
  useEffect(() => {
    if (!conversationId || !supabase) return undefined;
    let active = true;
    setConnection('connecting');

    const channel = supabase
      .channel(`messages:${conversationId}:${createUuid().slice(0, 8)}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          if (!active || !payload.new?.id) return;
          ingestMessages(conversationId, [payload.new]);
          onIncomingRef.current?.(normalizeMessage(payload.new));
        },
      )
      .subscribe((status) => {
        if (!active) return;
        if (status === 'SUBSCRIBED') {
          setConnection('live');
          // Fill any gap between the last fetch and (re)subscribing.
          if (messageStore.get(conversationId).loaded) fetchNewerMessages(conversationId);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setConnection('reconnecting');
        }
      });

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  // Coming back online: retry messages that failed offline and catch up.
  useEffect(() => {
    if (!conversationId) return undefined;
    const handleOnline = () => {
      retryOfflineMessages(conversationId);
      fetchNewerMessages(conversationId);
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [conversationId]);

  const send = useCallback(
    (payload) => (conversationId && viewer ? sendMessage(conversationId, viewer, payload) : Promise.resolve({ ok: false })),
    [conversationId, viewer],
  );
  const retry = useCallback((clientId) => retryMessage(clientId), []);
  const discard = useCallback((clientId) => conversationId && discardMessage(conversationId, clientId), [conversationId]);
  const loadOlder = useCallback(() => (conversationId ? loadOlderMessages(conversationId) : undefined), [conversationId]);
  const reload = useCallback(() => conversationId && loadInitialMessages(conversationId), [conversationId]);

  return { ...state, connection, send, retry, discard, loadOlder, reload };
}
