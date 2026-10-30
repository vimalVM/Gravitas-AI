import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MessagesSquare } from 'lucide-react';
import { APP } from '../config/app';
import { useAuth } from '../hooks/useAuth';
import { useConversationMessages } from '../hooks/useConversationMessages';
import { useInbox } from '../hooks/useInbox';
import { useRealtimeRooms } from '../hooks/useRealtimeRooms';
import { fetchConversation } from '../services/chatApi';
import ChatHeader, { PresenceText } from '../components/chat/ChatHeader';
import ChatPanel from '../components/chat/ChatPanel';
import ConversationDetails from '../components/chat/ConversationDetails';
import Avatar from '../components/common/Avatar';
import { Sheet } from '../components/common/Dialogs';
import { EmptyState, ErrorBanner, LoadingState } from '../components/common/States';
import ConversationList from '../components/operator/ConversationList';

const MAX_PRESENCE_ROOMS = 40;

/**
 * Operator Console. Desktop/tablet: inbox + conversation side by side.
 * Mobile: the inbox first, then a full-screen chat with a Back button.
 */
export default function OperatorDashboard() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const viewer = useMemo(() => ({ id: profile.id, role: profile.role }), [profile.id, profile.role]);

  const inbox = useInbox(conversationId ?? null);
  const roomIds = useMemo(() => {
    const ids = inbox.conversations.slice(0, MAX_PRESENCE_ROOMS).map((c) => c.id);
    if (conversationId && !ids.includes(conversationId)) ids.push(conversationId);
    return ids;
  }, [inbox.conversations, conversationId]);
  const rooms = useRealtimeRooms(roomIds, viewer);

  // Conversation details: from the inbox, or fetched directly (deep links / older conversations).
  const listed = inbox.conversations.find((c) => c.id === conversationId) ?? null;
  const [fetched, setFetched] = useState({ id: null, conversation: null, error: null });
  useEffect(() => {
    if (!conversationId || listed || inbox.status === 'loading' || fetched.id === conversationId) return;
    let cancelled = false;
    fetchConversation(conversationId)
      .then((conversation) => !cancelled && setFetched({ id: conversationId, conversation, error: null }))
      .catch((error) => !cancelled && setFetched({ id: conversationId, conversation: null, error }));
    return () => {
      cancelled = true;
    };
  }, [conversationId, listed, inbox.status, fetched.id]);
  const active = listed ?? (fetched.id === conversationId ? fetched.conversation : null);
  const activeError = !listed && fetched.id === conversationId ? fetched.error : null;

  const chat = useConversationMessages(active?.id ?? null, viewer);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    document.title = inbox.totalUnread > 0 ? `(${inbox.totalUnread}) Operator Console · Gravitas AI` : 'Operator Console · Gravitas AI';
    return () => {
      document.title = 'Gravitas AI';
    };
  }, [inbox.totalUnread]);

  const { markReadLocally } = inbox;
  const { sendTyping } = rooms;
  const activeId = active?.id;
  const userName = active?.user?.displayName ?? 'User';
  const userAvatar = useMemo(() => <Avatar name={userName} src={active?.user?.avatarUrl} size={30} />, [userName, active?.user?.avatarUrl]);

  const labelFor = useCallback((message, own) => (own ? `${APP.assistantName} (you)` : userName), [userName]);
  const avatarFor = useCallback((message, own) => (own ? null : userAvatar), [userAvatar]);
  const handleTyping = useCallback((isTyping) => sendTyping(activeId, isTyping), [sendTyping, activeId]);
  const handleRead = useCallback(() => activeId && markReadLocally(activeId), [markReadLocally, activeId]);

  const userOnline = Boolean(activeId && rooms.online[activeId]?.user);
  const userTyping = Boolean(activeId && rooms.typing[activeId] === 'user');

  let main;
  if (!conversationId) {
    main = (
      <EmptyState
        icon={MessagesSquare}
        title="Select a conversation"
        description={`Choose a user from the inbox to read their messages and reply as ${APP.assistantName}.`}
        className="h-full"
      />
    );
  } else if (active) {
    main = (
      <ChatPanel
        key={active.id}
        conversationId={active.id}
        chat={chat}
        viewer={viewer}
        header={
          <ChatHeader
            onBack={() => navigate('/ai/dashboard')}
            avatar={<Avatar name={userName} src={active.user?.avatarUrl} size={42} online={userOnline} />}
            title={userName}
            status={rooms.available ? <PresenceText online={userOnline} typing={userTyping} /> : null}
            subtitle={active.project.name}
            onInfo={() => setDetailsOpen(true)}
            infoLabel="User details"
          />
        }
        labelFor={labelFor}
        avatarFor={avatarFor}
        typingLabel={userTyping ? userName : null}
        typingAvatar={userAvatar}
        onTyping={handleTyping}
        onRead={handleRead}
        placeholder={`Reply as ${APP.assistantName}`}
        emptyDescription="This user has not sent any messages yet."
        startNotice={`Replies you send appear to ${userName} as "${APP.assistantName}".`}
      />
    );
  } else if (activeError) {
    main = (
      <div className="flex h-full items-center justify-center p-4">
        <ErrorBanner className="w-full max-w-md" title="Conversation unavailable" message={activeError.message} onRetry={() => setFetched({ id: null, conversation: null, error: null })} />
      </div>
    );
  } else {
    main = <LoadingState label="Opening conversation..." className="h-full" />;
  }

  return (
    <div className="flex h-dvh bg-slate-100 md:gap-4 md:p-4">
      <aside
        className={`${conversationId ? 'hidden md:flex' : 'flex'} w-full flex-col overflow-hidden md:w-80 md:shrink-0 md:rounded-3xl md:shadow-sm md:ring-1 md:ring-slate-200 lg:w-96`}
        aria-label="Conversations"
      >
        <ConversationList inbox={inbox} rooms={rooms} />
      </aside>

      <main
        className={`${conversationId ? 'flex' : 'hidden md:flex'} min-w-0 flex-1 flex-col overflow-hidden bg-white md:rounded-3xl md:shadow-sm md:ring-1 md:ring-slate-200`}
      >
        {main}
      </main>

      {active && (
        <Sheet open={detailsOpen} title="User details" onClose={() => setDetailsOpen(false)}>
          <ConversationDetails conversation={active} mode="operator" online={userOnline} />
        </Sheet>
      )}
    </div>
  );
}
