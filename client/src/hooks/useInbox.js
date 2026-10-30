import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { listConversations } from '../services/chatApi';
import { createUuid } from '../utils/ids';
import { normalizeMessage } from '../utils/messages';

const byLatest = (a, b) =>
  new Date(b.lastMessage?.at ?? b.createdAt) - new Date(a.lastMessage?.at ?? a.createdAt);

/**
 * Operator inbox: every conversation with previews and unread counts, kept
 * live through Realtime (new messages and conversation updates).
 */
export function useInbox(activeConversationId) {
  const [conversations, setConversations] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const activeRef = useRef(activeConversationId);
  const seenMessages = useRef(new Set());
  const refetchTimer = useRef(null);
  const knownIds = useRef(new Set());

  useEffect(() => {
    activeRef.current = activeConversationId;
  }, [activeConversationId]);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setStatus((s) => (s === 'ready' ? s : 'loading'));
    try {
      const list = await listConversations({ limit: 200 });
      knownIds.current = new Set(list.map((c) => c.id));
      setConversations(list.sort(byLatest));
      setStatus('ready');
      setError(null);
    } catch (err) {
      setError(err);
      setStatus((s) => (s === 'ready' ? s : 'error'));
    }
  }, []);

  const scheduleRefetch = useCallback(() => {
    clearTimeout(refetchTimer.current);
    refetchTimer.current = setTimeout(() => load({ silent: true }), 400);
  }, [load]);

  useEffect(() => {
    load();
    return () => clearTimeout(refetchTimer.current);
  }, [load]);

  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;
    let subscribedBefore = false;

    const channel = supabase
      .channel(`inbox:${createUuid().slice(0, 8)}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        if (!active || !payload.new?.id || seenMessages.current.has(payload.new.id)) return;
        seenMessages.current.add(payload.new.id);
        const message = normalizeMessage(payload.new);

        if (!knownIds.current.has(message.conversationId)) {
          scheduleRefetch();
          return;
        }
        const countsAsUnread =
          message.senderRole === 'user' &&
          (message.conversationId !== activeRef.current || document.visibilityState !== 'visible');

        setConversations((prev) =>
          prev
            .map((c) =>
              c.id === message.conversationId
                ? {
                    ...c,
                    lastMessage: {
                      at: message.createdAt,
                      preview: message.content?.slice(0, 160) ?? null,
                      type: message.type,
                      senderRole: message.senderRole,
                    },
                    unreadCount: countsAsUnread ? (c.unreadCount ?? 0) + 1 : c.unreadCount,
                  }
                : c,
            )
            .sort(byLatest),
        );
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversations' }, () => {
        if (active) scheduleRefetch();
      })
      .subscribe((state) => {
        if (!active) return;
        if (state === 'SUBSCRIBED') {
          // After a reconnect, re-sync previews and unread counts we may have missed.
          if (subscribedBefore) load({ silent: true });
          subscribedBefore = true;
        }
      });

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [load, scheduleRefetch]);

  const markReadLocally = useCallback((conversationId) => {
    setConversations((prev) => prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)));
  }, []);

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);

  return { conversations, status, error, reload: load, markReadLocally, totalUnread };
}
