import { DEFAULT_PROJECT } from '../../config/app';
import Logo, { Wordmark } from '../brand/Logo';
import StatusBadge from '../brand/StatusBadge';

/** Compact mobile header for non-chat pages: logo, project name and status. */
export default function AppHeader({ project = DEFAULT_PROJECT, title }) {
  return (
    <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 pt-safe lg:hidden">
      <Logo size={34} />
      <div className="min-w-0 flex-1 leading-tight">
        <Wordmark className="block text-sm" />
        <p className="truncate text-xs text-slate-500">{title ?? project.name}</p>
      </div>
      <StatusBadge status={project.status} />
    </header>
  );
}
