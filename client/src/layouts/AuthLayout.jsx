import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { APP, GROUP } from '../config/app';
import Logo, { Wordmark } from '../components/brand/Logo';
import ProjectCard from '../components/brand/ProjectCard';

/**
 * Split layout for the sign-in pages. `variant="operator"` uses the darker
 * Operator Console styling.
 */
export default function AuthLayout({ variant = 'user', title, subtitle, children, footer }) {
  const operator = variant === 'operator';
  return (
    <div className={`min-h-dvh ${operator ? 'bg-navy-950' : 'bg-slate-100'} lg:grid lg:grid-cols-[1.05fr_1fr]`}>
      <aside className={`relative hidden overflow-hidden p-10 lg:flex lg:flex-col ${operator ? 'bg-navy-900' : 'bg-navy-950'}`}>
        <div className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full border border-white/5" aria-hidden="true" />
        <div className="pointer-events-none absolute -top-8 -right-8 size-64 rounded-full border border-white/5" aria-hidden="true" />
        <Link to="/" className="flex items-center gap-3">
          <Logo size={42} />
          <Wordmark light className="text-lg" />
        </Link>
        <div className="mt-auto max-w-md">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-navy-100">
            {operator ? <ShieldCheck className="size-3.5" aria-hidden="true" /> : null}
            {operator ? APP.operatorConsoleName : GROUP.label}
          </p>
          <h2 className="mt-4 text-3xl leading-tight font-bold text-white">{APP.subtitle}</h2>
          <p className="mt-3 text-sm leading-relaxed text-navy-200">
            Gravitas AI is a simulated assistant: replies are written by a human operator through a separate, secured Operator Console.
          </p>
          <ProjectCard variant="compact" className="mt-8 max-w-sm border-white/10" />
        </div>
      </aside>

      <main className="flex min-h-dvh flex-col px-4 py-6 pt-safe sm:px-8 lg:py-10">
        <Link
          to="/"
          className={`inline-flex w-fit items-center gap-1.5 rounded-xl px-2 py-1.5 text-sm font-semibold ${operator ? 'text-navy-200 hover:bg-white/10' : 'text-slate-600 hover:bg-white'}`}
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> Back
        </Link>
        <div className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-md">
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <Logo size={40} />
              <Wordmark light={operator} className="text-base" />
            </div>
            <div className={`rounded-3xl p-6 shadow-xl sm:p-8 ${operator ? 'bg-white shadow-black/30' : 'bg-white shadow-navy-900/5 ring-1 ring-slate-200'}`}>
              <h1 className="text-2xl font-bold text-navy-900">{title}</h1>
              {subtitle && <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>}
              <div className="mt-6">{children}</div>
            </div>
            {footer && <div className={`mt-6 text-center text-sm ${operator ? 'text-navy-200' : 'text-slate-600'}`}>{footer}</div>}
          </div>
        </div>
      </main>
    </div>
  );
}
