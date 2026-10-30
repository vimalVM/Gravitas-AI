import { supabase } from '../lib/supabaseClient';

/**
 * Shared registry for private Realtime rooms ("room:<conversationId>").
 * supabase-js reuses channels by topic and removes them asynchronously, so
 * rooms are reference-counted and torn down after a short delay instead of
 * being re-created on every React mount/unmount.
 */
const rooms = new Map();
const TEARDOWN_DELAY_MS = 1500;

function emit(room, event) {
  room.last[event.type] = event;
  room.listeners.forEach((listener) => listener(event));
}

function destroy(room) {
  clearTimeout(room.teardownTimer);
  rooms.delete(room.id);
  supabase?.removeChannel(room.channel);
}

function createRoom(id, viewer) {
  const channel = supabase.channel(`room:${id}`, {
    config: { private: true, presence: { key: viewer.id }, broadcast: { self: false } },
  });
  const room = { id, viewerId: viewer.id, channel, listeners: new Set(), last: {}, teardownTimer: null };

  channel
    .on('presence', { event: 'sync' }, () => {
      const roles = { user: false, ai_operator: false };
      for (const [key, metas] of Object.entries(channel.presenceState())) {
        if (key === viewer.id) continue;
        for (const meta of metas) if (meta.role in roles) roles[meta.role] = true;
      }
      emit(room, { type: 'presence', roles });
    })
    .on('broadcast', { event: 'typing' }, ({ payload }) => {
      if (!payload || payload.userId === viewer.id) return;
      emit(room, { type: 'typing', role: payload.role, typing: Boolean(payload.typing) });
    })
    .subscribe(async (status) => {
      emit(room, { type: 'status', status });
      if (status === 'SUBSCRIBED') {
        await channel.track({ role: viewer.role, onlineAt: new Date().toISOString() });
      }
    });

  rooms.set(id, room);
  return room;
}

/** Joins a room and returns a release function. Late subscribers receive the last known state. */
export function acquireRoom(id, viewer, listener) {
  if (!supabase || !id || !viewer?.id) return () => {};
  let room = rooms.get(id);
  if (room && room.viewerId !== viewer.id) {
    destroy(room);
    room = null;
  }
  if (!room) room = createRoom(id, viewer);

  clearTimeout(room.teardownTimer);
  room.listeners.add(listener);
  Object.values(room.last).forEach((event) => listener(event));

  return () => {
    room.listeners.delete(listener);
    if (room.listeners.size === 0) {
      room.teardownTimer = setTimeout(() => destroy(room), TEARDOWN_DELAY_MS);
    }
  };
}

export function broadcastTyping(id, viewer, typing) {
  const room = rooms.get(id);
  if (!room) return;
  room.channel.send({ type: 'broadcast', event: 'typing', payload: { userId: viewer.id, role: viewer.role, typing } });
}

/** Leaves every room (sign-out). */
export function resetRooms() {
  [...rooms.values()].forEach(destroy);
}
