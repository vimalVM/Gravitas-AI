import { dbError, notFound } from '../utils/httpError.js';
import { defaultProject } from '../config/project.js';

const CONVERSATION_COLUMNS =
  'id, user_id, title, project_name, project_code, project_description, status, last_message_at, ' +
  'last_message_preview, last_message_type, last_message_sender_role, created_at, updated_at';

/**
 * Explicit authorization check (the service-role client bypasses RLS).
 * Operators may open any conversation in the inbox; users only their own.
 * Unauthorized access is reported as "not found" so ids cannot be probed.
 */
export function assertConversationAccess(conversation, auth) {
  if (!conversation) throw notFound('Conversation not found.');
  if (auth.role === 'ai_operator') return conversation;
  if (auth.role === 'user' && conversation.user_id === auth.user.id) return conversation;
  throw notFound('Conversation not found.');
}

function toApi(row, user, unreadCount = 0) {
  return {
    id: row.id,
    title: row.title,
    project: {
      name: row.project_name,
      code: row.project_code,
      description: row.project_description,
      status: row.status,
    },
    lastMessage: row.last_message_at
      ? {
          at: row.last_message_at,
          preview: row.last_message_preview,
          type: row.last_message_type,
          senderRole: row.last_message_sender_role,
        }
      : null,
    user,
    unreadCount,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createConversationService({ supabase, storage, profiles }) {
  return {
    async getById(id) {
      const { data, error } = await supabase.from('conversations').select(CONVERSATION_COLUMNS).eq('id', id).maybeSingle();
      if (error) throw dbError(error, 'load conversation');
      return data;
    },

    /** Loads a conversation and verifies the caller may access it. */
    async getAuthorized(id, auth) {
      return assertConversationAccess(await this.getById(id), auth);
    },

    async list(auth, { search, limit }) {
      const { data, error } = await supabase.rpc('list_conversations', {
        p_viewer: auth.user.id,
        p_search: search ?? null,
        p_limit: limit,
      });
      if (error) throw dbError(error, 'list conversations');
      const rows = data ?? [];
      const avatars = await storage.signMany(rows.map((r) => r.user_avatar_path));
      return rows.map((row) =>
        toApi(
          row,
          { id: row.user_id, displayName: row.user_display_name, avatarUrl: avatars.get(row.user_avatar_path)?.url ?? null },
          row.unread_count ?? 0,
        ),
      );
    },

    /** Returns the user's conversation for the active project, creating it (with one welcome message) if needed. */
    async ensureForUser(auth) {
      const { data, error } = await supabase.rpc('ensure_user_conversation', {
        p_user_id: auth.user.id,
        p_title: defaultProject.title,
        p_project_name: defaultProject.name,
        p_project_code: defaultProject.code,
        p_project_description: defaultProject.description,
        p_status: defaultProject.status,
        p_welcome: defaultProject.welcomeMessage,
      });
      if (error) throw dbError(error, 'ensure conversation');
      const row = Array.isArray(data) ? data[0] : data;
      if (!row?.id) throw dbError({ message: 'ensure_user_conversation returned no row' }, 'ensure conversation');
      return this.toDetailed(row, auth);
    },

    /** Conversation with its owner's public profile and the caller's unread count. */
    async toDetailed(row, auth) {
      const owner = row.user_id === auth.user.id ? auth.profile : await profiles.getById(row.user_id);
      const avatar = owner?.avatar_path ? await storage.signOne(owner.avatar_path) : null;
      const unread = await this.countUnread(row.id, auth);
      return toApi(
        row,
        owner ? { id: owner.id, displayName: owner.display_name, avatarUrl: avatar?.url ?? null } : null,
        unread,
      );
    },

    async countUnread(conversationId, auth) {
      const { data: read, error: readError } = await supabase
        .from('conversation_reads')
        .select('last_read_at')
        .eq('conversation_id', conversationId)
        .eq('user_id', auth.user.id)
        .maybeSingle();
      if (readError) throw dbError(readError, 'load read state');

      let query = supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', conversationId)
        .neq('sender_role', auth.role);
      if (read?.last_read_at) query = query.gt('created_at', read.last_read_at);
      const { count, error } = await query;
      if (error) throw dbError(error, 'count unread');
      return count ?? 0;
    },

    async markRead(conversationId, auth) {
      const { data, error } = await supabase.rpc('mark_conversation_read', {
        p_conversation_id: conversationId,
        p_user_id: auth.user.id,
      });
      if (error) throw dbError(error, 'mark read');
      return data;
    },
  };
}
