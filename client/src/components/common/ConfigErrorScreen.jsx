import { Settings } from 'lucide-react';
import Logo from '../brand/Logo';

/** Shown instead of the app when client/.env is incomplete. */
export default function ConfigErrorScreen({ problems }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
        <div className="flex items-center gap-3">
          <Logo size={40} />
          <div>
            <h1 className="text-lg font-bold text-navy-900">Gravitas AI needs configuration</h1>
            <p className="text-sm text-slate-500">The frontend can't connect to Supabase yet.</p>
          </div>
        </div>
        <ul className="mt-5 space-y-2 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
          {problems.map((problem) => (
            <li key={problem} className="flex gap-2">
              <Settings className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> {problem}
            </li>
          ))}
        </ul>
        <ol className="mt-5 list-decimal space-y-1.5 pl-5 text-sm text-slate-600">
          <li>Copy <code className="rounded bg-slate-100 px-1">client/.env.example</code> to <code className="rounded bg-slate-100 px-1">client/.env</code>.</li>
          <li>Paste your Supabase Project URL and publishable (anon) key.</li>
          <li>Restart <code className="rounded bg-slate-100 px-1">npm run dev</code> so Vite picks up the new values.</li>
        </ol>
      </div>
    </main>
  );
}
