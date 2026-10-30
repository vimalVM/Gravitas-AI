import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { EmptyState } from '../components/common/States';

export default function NotFoundPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-100 p-4">
      <EmptyState
        icon={Compass}
        title="Page not found"
        description="The page you are looking for doesn't exist or has moved."
        action={
          <Link to="/" className="inline-flex h-11 items-center rounded-xl bg-navy-900 px-5 text-sm font-semibold text-white hover:bg-navy-800">
            Back to Gravitas AI
          </Link>
        }
      />
    </main>
  );
}
