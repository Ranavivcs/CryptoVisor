import { Navigate, Outlet, useLocation } from 'react-router';
import { useMe } from '../hooks/useAuth';

function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center text-slate-400" role="status">
      Loading…
    </div>
  );
}

/**
 * Wraps every signed-in page. Sends guests to /login, and users without
 * preferences to /onboarding (so the quiz runs once, right after the first login).
 */
export function RequireAuth() {
  const { data: user, isPending } = useMe();
  const { pathname } = useLocation();

  if (isPending) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.hasPreferences && pathname !== '/onboarding') return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}

/** Wraps /login and /signup: a signed-in user has no reason to see them. */
export function GuestOnly() {
  const { data: user, isPending } = useMe();

  if (isPending) return <FullPageSpinner />;
  if (user) return <Navigate to={user.hasPreferences ? '/' : '/onboarding'} replace />;
  return <Outlet />;
}
