import { Button } from '../components/ui/Button';
import { useLogout, useMe } from '../hooks/useAuth';

/** Placeholder: the four dashboard sections are built in the next step. */
export function DashboardPage() {
  const { data: user } = useMe();
  const logoutMutation = useLogout();
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Good to see you, {user?.name}</h1>
        <Button variant="ghost" loading={logoutMutation.isPending} onClick={() => logoutMutation.mutate()}>
          Log out
        </Button>
      </header>
    </main>
  );
}
