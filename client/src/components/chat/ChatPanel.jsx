import { useCallback } from 'react';
import { useToast } from '../../hooks/useAuth';
import { useReadStatus } from '../../hooks/useReadStatus';
import ChatMessageList from './ChatMessageList';
import ConnectionBanner from './ConnectionBanner';
import MessageComposer from './MessageComposer';

/**
 * The complete chat column used by BOTH the user chat and the operator
 * console: header, live message history and composer. Which side each
 * message appears on is decided per message from the signed-in viewer.
 */
export default function ChatPanel({
  conversationId,
  chat,
  viewer,
  header,
  labelFor,
  avatarFor,
  typingLabel,
  typingAvatar,
  onTyping,
  onRead,
  placeholder,
  emptyTitle,
  emptyDescription,
  startNotice,
}) {
  const toast = useToast();
  useReadStatus(conversationId, chat.items, viewer, { onMarked: onRead });

  const handleSend = useCallback(
    async (payload) => {
      const result = await chat.send(payload);
      if (!result.ok && result.error) {
        toast.error(payload.file ? 'Image not sent' : 'Message not sent', result.error.message);
      }
    },
    [chat, toast],
  );

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col bg-white" aria-label="Chat">
      {header}
      <ConnectionBanner connection={chat.connection} />
      <ChatMessageList
        chat={chat}
        viewer={viewer}
        labelFor={labelFor}
        avatarFor={avatarFor}
        typingLabel={typingLabel}
        typingAvatar={typingAvatar}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        startNotice={startNotice}
      />
      <MessageComposer onSend={handleSend} onTyping={onTyping} disabled={!conversationId} placeholder={placeholder} />
    </section>
  );
}
