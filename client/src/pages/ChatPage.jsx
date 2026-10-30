import { useCallback, useState } from 'react';
import { APP } from '../config/app';
import { useWorkspace } from '../hooks/useAuth';
import Logo from '../components/brand/Logo';
import GroupBadge from '../components/brand/GroupBadge';
import ChatHeader, { PresenceText } from '../components/chat/ChatHeader';
import ChatPanel from '../components/chat/ChatPanel';
import ConversationDetails from '../components/chat/ConversationDetails';
import { Sheet } from '../components/common/Dialogs';
import { ErrorBanner, LoadingState } from '../components/common/States';

const aiAvatar = <Logo size={30} title={APP.assistantName} />;

/** The user's chat with Gravitas AI: own messages on the right, Gravitas AI on the left. */
export default function ChatPage() {
  const { conversation, conversationStatus, conversationError, reloadConversation, chat, viewer, rooms, clearUnread } = useWorkspace();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const conversationId = conversation?.id;

  const labelFor = useCallback((message, own) => (own ? null : APP.assistantName), []);
  const avatarFor = useCallback((message, own) => (own ? null : aiAvatar), []);
  const handleTyping = useCallback((isTyping) => rooms.sendTyping(conversationId, isTyping), [rooms, conversationId]);

  if (conversationStatus === 'loading' && !conversation) return <LoadingState label="Opening your conversation..." className="flex-1" />;
  if (!conversation) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <ErrorBanner className="w-full max-w-md" title="Couldn't open your conversation" message={conversationError?.message} onRetry={reloadConversation} />
      </div>
    );
  }

  const operatorOnline = Boolean(rooms.online[conversationId]?.ai_operator);
  const operatorTyping = rooms.typing[conversationId] === 'ai_operator';

  return (
    <>
      <ChatPanel
        key={conversationId}
        conversationId={conversationId}
        chat={chat}
        viewer={viewer}
        header={
          <ChatHeader
            avatar={<Logo size={42} />}
            title={APP.assistantName}
            badges={<GroupBadge className="shrink-0" />}
            status={rooms.available ? <PresenceText online={operatorOnline} typing={operatorTyping} /> : null}
            subtitle={conversation.project.name}
            onInfo={() => setDetailsOpen(true)}
          />
        }
        labelFor={labelFor}
        avatarFor={avatarFor}
        typingLabel={operatorTyping ? APP.assistantName : null}
        typingAvatar={aiAvatar}
        onTyping={handleTyping}
        onRead={clearUnread}
        placeholder={`Message ${APP.assistantName}`}
        emptyDescription={`Ask ${APP.assistantName} anything about ${conversation.project.name}.`}
        startNotice={`${APP.assistantName} is a simulated AI experience - replies are written by a human operator.`}
      />
      <Sheet open={detailsOpen} title="Conversation details" onClose={() => setDetailsOpen(false)}>
        <ConversationDetails conversation={conversation} mode="user" online={operatorOnline} />
      </Sheet>
    </>
  );
}
