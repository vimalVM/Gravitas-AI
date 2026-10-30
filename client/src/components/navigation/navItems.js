import { FolderKanban, House, MessageCircle, UserRound } from 'lucide-react';

/** Navigation for the user area (bottom bar on mobile, sidebar on desktop). */
export const USER_NAV_ITEMS = [
  { to: '/home', label: 'Home', icon: House },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/chat', label: 'Chat', icon: MessageCircle, badgeKey: 'unread' },
  { to: '/profile', label: 'Profile', icon: UserRound },
];
