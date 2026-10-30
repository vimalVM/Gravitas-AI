import { useCallback, useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { APP } from '../config/app';
import { useAuth } from '../hooks/useAuth';
import { useConversationMessages } from '../hooks/useConversationMessages';
import { useRealtimeRooms } from '../hooks/useRealtimeRooms';
import { ensureMyConversation } from '../services/chatApi';
import { WorkspaceContext } from '../context/contexts';
import { BrandMark } from '../components/brand/Logo';
import GroupBadge from '../components/brand/GroupBadge';
import ProjectCard from '../components/brand/ProjectCard';
import Avatar from '../components/common/Avatar';
import BottomNavigation from '../components/navigation/BottomNavigation';
import { USER_NAV_ITEMS } from '../components/navigation/navItems';

/**
 * Layout for signed-in users. Owns the user's conversation, its live message
 * stream and presence, so they stay connected while moving between pages.
 */
export default function AppLayout() {
  const { profile } = useAuth();
  const location = useLocation();
  const onChatPage = location.pathname.startsWith('/chat');

  const [conversation, setConversation] = useState(null);
  const [conversationStatus, setConversationStatus] = useState('loading');
  const [conversationError, setConversationError] = useState(null);
  const [unread, setUnread] = useState(0);

  const loadConversation = useCallback(async () => {
    setConversationStatus('loading');
    setConversationError(null);
    try {
      const next = await ensureMyConversation();
      setConversation(next);
      setUnread(next.unreadCount ?? 0);
      setConversationStatus('ready');
    } catch (error) {
      setConversationError(error);
      setConversationStatus('error');
    }
  }, []);

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  const viewer = useMemo(() => ({ id: profile.id, role: profile.role }), [profile.id, profile.role]);
  const conversationId = conversation?.id ?? null;

  const handleIncoming = useCallback(
    (message) => {
      if (message.senderRole !== viewer.role && (!onChatPage || document.visibilityState !== 'visible')) {
        setUnread((count) => count + 1);
      }
    },
    [viewer.role, onChatPage],
  );

  const chat = useConversationMessages(conversationId, viewer, { onIncoming: handleIncoming });
  const roomIds = useMemo(() => (conversationId ? [conversationId] : []), [conversationId]);
  const rooms = useRealtimeRooms(roomIds, viewer);

  const workspace = useMemo(
    () => ({
      conversation,
      conversationStatus,
      conversationError,
      reloadConversation: loadConversation,
      chat,
      viewer,
      rooms,
      unread,
      clearUnread: () => setUnread(0),
    }),
    [conversation, conversationStatus, conversationError, loadConversation, chat, viewer, rooms, unread],
  );

  const project = conversation?.project;

  return (
    <WorkspaceContext.Provider value={workspace}>
      <div className="flex h-dvh flex-col lg:mx-auto lg:max-w-7xl lg:flex-row lg:gap-4 lg:p-4">
        <aside className="hidden w-80 shrink-0 flex-col gap-4 overflow-y-auto rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 lg:flex" aria-label="Sidebar">
          <BrandMark size={40} subtitle={APP.subtitle} />
          <GroupBadge variant="card" />
          <ProjectCard project={project} />

          <nav aria-label="Main" className="mt-1">
            <ul className="space-y-1">
              {USER_NAV_ITEMS.map(({ to, label, icon: Icon, badgeKey }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${isActive ? 'bg-navy-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-navy-900'}`
                    }
                  >
                    <Icon className="size-5" aria-hidden="true" />
                    <span className="flex-1">{label}</span>
                    {badgeKey === 'unread' && unread > 0 && (
                      <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-bold text-white">{unread}</span>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <NavLink to="/profile" className="mt-auto flex items-center gap-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200 hover:bg-slate-100">
            <Avatar name={profile.displayName} src={profile.avatarUrl} size={40} />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-navy-900">{profile.displayName}</p>
              <p className="truncate text-xs text-slate-500">{profile.email}</p>
            </div>
          </NavLink>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-slate-50 lg:rounded-3xl lg:shadow-sm lg:ring-1 lg:ring-slate-200">
          <div className="flex min-h-0 flex-1 flex-col">
            <Outlet />
          </div>
          <BottomNavigation badges={{ unread }} />
        </div>
      </div>
    </WorkspaceContext.Provider>
  );
}
