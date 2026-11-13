import { Navigate, Outlet, useLocation } from 'react-router';
import { useMe } from '../hooks/useAuth';
import { useIsSlow, WAKING_UP_MESSAGE } from '../hooks/useIsSlow';

/**
 * Shown while the first "who am I?" request runs. That's usually the request that hits a
 * sleeping server, so after a few seconds it explains the wait instead of looking frozen.
 */
function FullPageSpinner() {
  const slow = useIsSlow(true); // only rendered while loading
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center text-slate-400" role="status">
      <p>Loading…</p>
      {slow && <p className="max-w-sm text-sm text-amber-200">{WAKING_UP_MESSAGE}</p>}
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
