import { useMemo, useState } from 'react';
import { Inbox, LogOut, Search, ShieldCheck } from 'lucide-react';
import { APP } from '../../config/app';
import { useAuth } from '../../hooks/useAuth';
import { BrandMark } from '../brand/Logo';
import Avatar from '../common/Avatar';
import { ConfirmationDialog } from '../common/Dialogs';
import { EmptyState, ErrorBanner, LoadingState } from '../common/States';
import ConversationListItem from './ConversationListItem';

/** Operator inbox sidebar: branding, operator profile, search and conversations. */
export default function ConversationList({ inbox, rooms }) {
  const { profile, signOut } = useAuth();
  const [query, setQuery] = useState('');
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return inbox.conversations;
    return inbox.conversations.filter(
      (c) =>
        c.user?.displayName?.toLowerCase().includes(q) ||
        c.lastMessage?.preview?.toLowerCase().includes(q) ||
        c.project.name.toLowerCase().includes(q),
    );
  }, [inbox.conversations, query]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="space-y-4 border-b border-slate-200 p-4 pt-safe">
        <div className="flex items-center justify-between gap-2 pt-1">
          <BrandMark size={36} subtitle={APP.operatorConsoleName} />
          {inbox.totalUnread > 0 && (
            <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-bold text-white">{inbox.totalUnread} unread</span>
          )}
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-2.5 ring-1 ring-slate-200">
          <Avatar name={profile.displayName} src={profile.avatarUrl} size={38} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-navy-900">{profile.displayName}</p>
            <p className="flex items-center gap-1 text-[11px] font-semibold text-navy-600">
              <ShieldCheck className="size-3" aria-hidden="true" /> AI Operator · replying as {APP.assistantName}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setConfirmLogout(true)}
            className="rounded-xl p-2 text-slate-500 hover:bg-white hover:text-rose-600"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="size-4" />
          </button>
        </div>

        <label className="relative block">
          <span className="sr-only">Search conversations</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search users or messages"
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pr-3 pl-9 text-sm focus:border-navy-300 focus:bg-white focus:ring-4 focus:ring-navy-100 focus:outline-none"
          />
        </label>
      </div>

      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-2">
        {inbox.status === 'loading' && <LoadingState label="Loading conversations..." />}
        {inbox.status === 'error' && (
          <ErrorBanner className="m-2" title="Couldn't load conversations" message={inbox.error?.message} onRetry={() => inbox.reload()} />
        )}
        {inbox.status === 'ready' && filtered.length === 0 && (
          <EmptyState
            icon={Inbox}
            title={query ? 'No matches' : 'No conversations yet'}
            description={query ? 'Try a different name or keyword.' : 'Conversations appear here when users open their chat with Gravitas AI.'}
          />
        )}
        <ul className="space-y-1">
          {filtered.map((conversation) => (
            <ConversationListItem
              key={conversation.id}
              conversation={conversation}
              online={Boolean(rooms.online[conversation.id]?.user)}
              typing={rooms.typing[conversation.id] === 'user'}
            />
          ))}
        </ul>
      </div>

      <ConfirmationDialog
        open={confirmLogout}
        title="Sign out of the Operator Console?"
        description="Users will see Gravitas AI as offline until an operator signs in again."
        confirmLabel="Sign out"
        tone="danger"
        loading={signingOut}
        onConfirm={async () => {
          setSigningOut(true);
          await signOut();
        }}
        onCancel={() => setConfirmLogout(false)}
      />
    </div>
  );
}
