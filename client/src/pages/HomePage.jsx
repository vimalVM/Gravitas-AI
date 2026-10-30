import { Link } from 'react-router-dom';
import { ArrowRight, Image as ImageIcon, Info, MessageCircle } from 'lucide-react';
import { APP } from '../config/app';
import { useAuth, useWorkspace } from '../hooks/useAuth';
import { formatListTime } from '../utils/date';
import { newestConfirmed } from '../utils/messages';
import Logo from '../components/brand/Logo';
import GroupBadge from '../components/brand/GroupBadge';
import ProjectCard from '../components/brand/ProjectCard';
import AppHeader from '../components/navigation/AppHeader';
import { ErrorBanner, Spinner } from '../components/common/States';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomePage() {
  const { profile } = useAuth();
  const { conversation, conversationStatus, conversationError, reloadConversation, chat, unread } = useWorkspace();
  const latest = newestConfirmed(chat.items);
  const latestPreview = latest
    ? { at: latest.createdAt, text: latest.content, type: latest.type, fromAi: latest.senderRole === 'ai_operator' }
    : conversation?.lastMessage
      ? { at: conversation.lastMessage.at, text: conversation.lastMessage.preview, type: conversation.lastMessage.type, fromAi: conversation.lastMessage.senderRole === 'ai_operator' }
      : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AppHeader project={conversation?.project} />
      <div className="scrollbar-thin flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl space-y-5 p-4 sm:p-6 lg:p-8">
          <div>
            <p className="text-sm font-medium text-slate-500">{greeting()},</p>
            <h1 className="text-2xl font-bold text-navy-900">{profile.displayName}</h1>
          </div>

          {conversationStatus === 'error' && (
            <ErrorBanner title="Couldn't load your conversation" message={conversationError?.message} onRetry={reloadConversation} />
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:hidden">
            <GroupBadge variant="card" />
            <ProjectCard project={conversation?.project} variant="compact" />
          </div>

          <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200" aria-labelledby="latest-heading">
            <div className="flex items-center justify-between">
              <h2 id="latest-heading" className="text-sm font-bold text-navy-900">Your conversation</h2>
              {unread > 0 && <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-bold text-white">{unread} new</span>}
            </div>
            <div className="mt-4 flex items-start gap-3">
              <Logo size={44} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-semibold text-navy-900">{APP.assistantName}</p>
                  {latestPreview && <span className="shrink-0 text-xs text-slate-400">{formatListTime(latestPreview.at)}</span>}
                </div>
                {conversationStatus === 'loading' ? (
                  <Spinner className="mt-1 size-4 text-slate-400" />
                ) : latestPreview ? (
                  <p className="mt-0.5 line-clamp-2 text-sm text-slate-600">
                    {!latestPreview.fromAi && <span className="font-medium text-slate-400">You: </span>}
                    {latestPreview.type === 'image' && <ImageIcon className="mr-1 inline size-3.5 align-[-2px]" aria-label="Photo" />}
                    {latestPreview.text || (latestPreview.type === 'image' ? 'Photo' : '')}
                  </p>
                ) : (
                  <p className="mt-0.5 text-sm text-slate-500">No messages yet.</p>
                )}
              </div>
            </div>
            <Link to="/chat" className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-navy-900 text-sm font-semibold text-white hover:bg-navy-800 sm:w-auto sm:px-5">
              <MessageCircle className="size-4" aria-hidden="true" /> Open chat <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </section>

          <div className="flex gap-3 rounded-2xl bg-blue-50 p-4 text-sm text-blue-900 ring-1 ring-blue-100">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>{APP.assistantName} is a simulated AI experience. A human operator reads your messages and replies from the Operator Console.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
