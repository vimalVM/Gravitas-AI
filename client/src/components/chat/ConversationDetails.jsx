import { CalendarDays, Info, UserRound } from 'lucide-react';
import { APP } from '../../config/app';
import { formatFullDate } from '../../utils/date';
import GroupBadge from '../brand/GroupBadge';
import Logo from '../brand/Logo';
import ProjectCard from '../brand/ProjectCard';
import Avatar from '../common/Avatar';

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <Icon className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
      <span className="text-sm text-slate-500">{label}</span>
      <span className="ml-auto truncate text-sm font-semibold text-navy-900">{value}</span>
    </div>
  );
}

/** Contents of the chat "details" sheet, for either participant. */
export default function ConversationDetails({ conversation, mode, online }) {
  const user = conversation.user;
  return (
    <>
      <div className="flex flex-col items-center rounded-2xl bg-white p-5 text-center ring-1 ring-slate-200">
        {mode === 'operator' ? (
          <Avatar name={user?.displayName} src={user?.avatarUrl} size={64} online={online} />
        ) : (
          <Logo size={64} />
        )}
        <h3 className="mt-3 text-base font-bold text-navy-900">{mode === 'operator' ? user?.displayName : APP.assistantName}</h3>
        <p className="text-xs text-slate-500">
          {mode === 'operator' ? 'Registered user' : 'Simulated AI assistant'} · {online ? 'Online' : 'Offline'}
        </p>
        <GroupBadge className="mt-3" />
      </div>

      <ProjectCard project={conversation.project} />

      <div className="divide-y divide-slate-100 rounded-2xl bg-white px-4 ring-1 ring-slate-200">
        {mode === 'operator' && <Row icon={UserRound} label="User" value={user?.displayName ?? 'Unknown'} />}
        <Row icon={CalendarDays} label="Started" value={formatFullDate(conversation.createdAt)} />
      </div>

      <div className="flex gap-3 rounded-2xl bg-blue-50 p-4 text-sm text-blue-900 ring-1 ring-blue-100">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p>
          {mode === 'operator'
            ? `Your replies are shown to the user as "${APP.assistantName}".`
            : `${APP.assistantName} is a simulated AI experience. Replies are written by a human operator through the separate Operator Console.`}
        </p>
      </div>
    </>
  );
}
