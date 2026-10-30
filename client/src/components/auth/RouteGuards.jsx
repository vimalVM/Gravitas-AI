import { Navigate, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { ROLE_HOME, ROLE_LOGIN } from '../../config/app';
import { useAuth } from '../../hooks/useAuth';
import Button from '../common/Button';
import { ErrorBanner, LoadingState } from '../common/States';
import Logo from '../brand/Logo';

function ProfileErrorScreen() {
  const { profileError, reloadProfile, signOut } = useAuth();
  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <Logo size={40} />
        <h1 className="mt-4 text-lg font-bold text-navy-900">We couldn't load your account</h1>
        <ErrorBanner className="mt-4" title="Profile unavailable" message={profileError?.message} onRetry={() => reloadProfile().catch(() => {})} />
        <Button variant="secondary" className="mt-4 w-full" onClick={signOut}>
          <LogOut className="size-4" aria-hidden="true" /> Sign out
        </Button>
      </div>
    </div>
  );
}

/** Requires a signed-in session with a loaded profile. */
export function ProtectedRoute({ children, loginPath = ROLE_LOGIN.user }) {
  const { session, profile, profileStatus, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <LoadingState fullScreen label="Restoring your session..." />;
  if (!session) return <Navigate to={loginPath} replace state={{ from: location.pathname }} />;
  if (profileStatus === 'error') return <ProfileErrorScreen />;
  if (!profile) return <LoadingState fullScreen label="Loading your profile..." />;
  return children;
}

/**
 * Restricts a route to one role. Wrong-role visitors are redirected to their
 * own area (users -> /chat, operators -> /ai/dashboard). The backend enforces
 * the same rules on every API call; this only keeps the UI consistent.
 */
export function RoleProtectedRoute({ role, children }) {
  return (
    <ProtectedRoute loginPath={ROLE_LOGIN[role]}>
      <RoleGate role={role}>{children}</RoleGate>
    </ProtectedRoute>
  );
}

function RoleGate({ role, children }) {
  const { profile } = useAuth();
  if (profile.role !== role) return <Navigate to={ROLE_HOME[profile.role] ?? '/'} replace />;
  return children;
}

/**
 * For login/register pages: visitors who are already signed in go to their
 * own area. `hold` pauses the redirect while a login attempt is being checked.
 */
export function RedirectIfSignedIn({ hold = false }) {
  const { session, profile } = useAuth();
  if (hold || !session || !profile) return null;
  return <Navigate to={ROLE_HOME[profile.role] ?? '/'} replace />;
}
