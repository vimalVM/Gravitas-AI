import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { DEFAULT_PROJECT, GROUP, PROJECT_STATUS } from '../config/app';
import { useWorkspace } from '../hooks/useAuth';
import { formatFullDate } from '../utils/date';
import ProjectCard from '../components/brand/ProjectCard';
import AppHeader from '../components/navigation/AppHeader';

export default function ProjectsPage() {
  const { conversation, chat } = useWorkspace();
  const project = conversation?.project ?? DEFAULT_PROJECT;

  const details = [
    ['Project name', project.name],
    ['Project identifier', project.code],
    ['Status', PROJECT_STATUS[project.status]?.label ?? project.status],
    ['Team', GROUP.label],
    ['Conversation started', conversation ? formatFullDate(conversation.createdAt) : '-'],
    ['Messages loaded', String(chat.items.filter((m) => m.id).length)],
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AppHeader project={project} title="Projects" />
      <div className="scrollbar-thin flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl space-y-5 p-4 sm:p-6 lg:p-8">
          <div>
            <h1 className="text-2xl font-bold text-navy-900">Projects</h1>
            <p className="text-sm text-slate-500">Your active project with Gravitas AI.</p>
          </div>

          <ProjectCard project={project} />

          <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200" aria-labelledby="details-heading">
            <h2 id="details-heading" className="text-sm font-bold text-navy-900">Project details</h2>
            <dl className="mt-3 divide-y divide-slate-100">
              {details.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-4 py-3">
                  <dt className="text-sm text-slate-500">{label}</dt>
                  <dd className="text-right text-sm font-semibold text-navy-900">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{project.description}</p>
          </section>

          <Link to="/chat" className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-navy-900 text-sm font-semibold text-white hover:bg-navy-800 sm:w-auto sm:px-5">
            <MessageCircle className="size-4" aria-hidden="true" /> Discuss this project
          </Link>
        </div>
      </div>
    </div>
  );
}
