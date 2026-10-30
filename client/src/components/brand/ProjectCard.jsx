import { FlaskConical, Hash } from 'lucide-react';
import { DEFAULT_PROJECT } from '../../config/app';
import StatusBadge from './StatusBadge';

/**
 * Active project information. `project` comes from the conversation record
 * when available, otherwise from shared/gravitas.config.json.
 */
export default function ProjectCard({ project = DEFAULT_PROJECT, variant = 'full', className = '', children }) {
  const compact = variant === 'compact';
  return (
    <section
      aria-label="Active project"
      className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${compact ? 'p-3' : 'p-4'} ${className}`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-navy-800 to-navy-950 text-blue-300 ${compact ? 'size-9' : 'size-11'}`}
        >
          <FlaskConical className={compact ? 'size-4' : 'size-5'} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">Active project</p>
          <h3 className={`truncate font-bold text-navy-900 ${compact ? 'text-sm' : 'text-base'}`}>{project.name}</h3>
        </div>
      </div>

      <div className={`flex flex-wrap items-center gap-2 ${compact ? 'mt-2.5' : 'mt-3'}`}>
        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 font-mono text-xs font-semibold text-slate-700">
          <Hash className="size-3" aria-hidden="true" />
          {project.code}
        </span>
        <StatusBadge status={project.status} />
      </div>

      {!compact && project.description && <p className="mt-3 text-sm leading-relaxed text-slate-600">{project.description}</p>}
      {children}
    </section>
  );
}
