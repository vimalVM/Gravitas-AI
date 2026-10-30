import { Link } from 'react-router-dom';
import { ArrowRight, Headset, Info, MessageCircle, ShieldCheck } from 'lucide-react';
import { APP, DEFAULT_PROJECT, GROUP, PROJECT_STATUS, ROLE_HOME } from '../config/app';
import { useAuth } from '../hooks/useAuth';
import Logo, { Wordmark } from '../components/brand/Logo';
import GroupBadge from '../components/brand/GroupBadge';
import ProjectCard from '../components/brand/ProjectCard';

function AccessCard({ to, eyebrow, title, description, cta, icon: Icon, dark = false, secondary }) {
  return (
    <div
      className={`group flex flex-col rounded-3xl p-6 shadow-sm ring-1 transition hover:-translate-y-0.5 hover:shadow-lg ${dark ? 'bg-navy-950 text-white ring-navy-900 hover:shadow-navy-900/20' : 'bg-white ring-slate-200 hover:shadow-navy-900/5'}`}
    >
      <span className={`flex size-12 items-center justify-center rounded-2xl ${dark ? 'bg-white/10 text-blue-300' : 'bg-navy-50 text-navy-700'}`}>
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <p className={`mt-5 text-xs font-bold tracking-[0.14em] uppercase ${dark ? 'text-blue-300' : 'text-blue-600'}`}>{eyebrow}</p>
      <h2 className={`mt-1 text-lg font-bold ${dark ? 'text-white' : 'text-navy-900'}`}>{title}</h2>
      <p className={`mt-1.5 flex-1 text-sm ${dark ? 'text-navy-200' : 'text-slate-500'}`}>{description}</p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link
          to={to}
          className={`inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${dark ? 'bg-white text-navy-950 hover:bg-navy-50' : 'bg-navy-900 text-white hover:bg-navy-800'}`}
        >
          {cta} <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
        {secondary}
      </div>
    </div>
  );
}

export default function PublicLandingPage() {
  const { profile } = useAuth();

  return (
    <div className="min-h-dvh bg-slate-100">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 pt-safe sm:px-6">
        <Link to="/" className="flex items-center gap-3" aria-label="Gravitas AI home">
          <Logo size={38} />
          <Wordmark className="text-[15px]" />
        </Link>
        {profile ? (
          <Link to={ROLE_HOME[profile.role]} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-white px-3.5 text-sm font-semibold text-navy-900 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50">
            Continue as {profile.displayName.split(' ')[0]} <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        ) : (
          <GroupBadge />
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
        <section className="grid items-center gap-8 py-6 lg:grid-cols-[1.1fr_1fr] lg:py-14">
          <div>
            <GroupBadge variant="card" className="w-fit" />
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-navy-950 sm:text-5xl">
              GRAVITAS <span className="text-blue-600">AI</span>
            </h1>
            <p className="mt-3 text-lg font-medium text-slate-600 sm:text-xl">{APP.subtitle}</p>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-slate-500">
              A focused, real-time workspace for project conversations. Ask questions, share images and get replies from{' '}
              {APP.assistantName} - all in one place.
            </p>
          </div>
          <ProjectCard className="lg:ml-auto lg:w-full lg:max-w-md">
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-sm">
              <div>
                <p className="text-xs text-slate-400">Team</p>
                <p className="font-semibold text-navy-900">{GROUP.label}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Project status</p>
                <p className="font-semibold text-navy-900">{PROJECT_STATUS[DEFAULT_PROJECT.status]?.label}</p>
              </div>
            </div>
          </ProjectCard>
        </section>

        <section className="grid gap-4 md:grid-cols-2" aria-label="Choose how to sign in">
          <AccessCard
            to="/login/user"
            eyebrow="User access"
            title="Continue as User"
            description="Start a conversation with Gravitas AI."
            cta="Continue as User"
            icon={MessageCircle}
            secondary={
              <Link to="/register" className="text-sm font-semibold text-navy-700 hover:text-navy-900 hover:underline">
                Create an account
              </Link>
            }
          />
          <AccessCard
            to="/login/ai"
            eyebrow="AI operator"
            title="Operator Console"
            description="Manage conversations and respond to users."
            cta="AI Operator Login"
            icon={Headset}
            dark
            secondary={
              <span className="inline-flex items-center gap-1 text-xs font-medium text-navy-200">
                <ShieldCheck className="size-3.5" aria-hidden="true" /> Authorised accounts only
              </span>
            }
          />
        </section>

        <p className="mx-auto mt-10 flex max-w-2xl items-start justify-center gap-2 text-center text-xs leading-relaxed text-slate-500">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {APP.assistantName} is a simulated AI experience built by {GROUP.label}. Replies are written by a human operator using the separate Operator
          Console - no autonomous AI model generates them.
        </p>
      </main>
    </div>
  );
}
