import { memo } from 'react';
import { NavLink } from 'react-router-dom';
import { Image as ImageIcon } from 'lucide-react';
import { APP } from '../../config/app';
import { formatListTime } from '../../utils/date';
import Avatar from '../common/Avatar';

function preview(lastMessage) {
  if (!lastMessage) return 'No messages yet';
  const prefix = lastMessage.senderRole === 'ai_operator' ? `${APP.assistantName}: ` : '';
  if (lastMessage.type === 'image') {
    return (
      <>
        {prefix}
        <ImageIcon className="mr-1 inline size-3.5 align-[-2px]" aria-label="Photo" />
        {lastMessage.preview || 'Photo'}
      </>
    );
  }
  return `${prefix}${lastMessage.preview ?? ''}`;
}

function ConversationListItem({ conversation, online, typing }) {
  const unread = conversation.unreadCount ?? 0;
  return (
    <li>
      <NavLink
        to={`/ai/dashboard/${conversation.id}`}
        className={({ isActive }) =>
          `flex items-center gap-3 rounded-2xl px-3 py-3 transition ${isActive ? 'bg-navy-50 ring-1 ring-navy-100' : 'hover:bg-slate-50'}`
        }
      >
        <Avatar name={conversation.user?.displayName} src={conversation.user?.avatarUrl} size={46} online={online} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className={`truncate text-sm ${unread ? 'font-bold text-navy-950' : 'font-semibold text-navy-900'}`}>
              {conversation.user?.displayName ?? 'Unknown user'}
            </p>
            <span className={`shrink-0 text-[11px] ${unread ? 'font-semibold text-blue-600' : 'text-slate-400'}`}>
              {formatListTime(conversation.lastMessage?.at ?? conversation.createdAt)}
            </span>
          </div>
          <div className="mt-0.5 flex items-center justify-between gap-2">
            <p className={`truncate text-[13px] ${unread ? 'font-medium text-slate-700' : 'text-slate-500'}`}>
              {typing ? <span className="font-semibold text-blue-600">typing...</span> : preview(conversation.lastMessage)}
            </p>
            {unread > 0 && (
              <span className="flex min-w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[11px] leading-5 font-bold text-white" aria-label={`${unread} unread`}>
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-[11px] text-slate-400">{conversation.project.name}</p>
        </div>
      </NavLink>
    </li>
  );
}

export default memo(ConversationListItem);
