import { QueryClientProvider, useQuery } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from '../api/client';
import { createQueryClient } from '../lib/queryClient';
import { RequireAuth } from '../routes/guards';
import { useLogout } from './useAuth';

const user = { id: 'u1', email: 'a@b.co', name: 'Ada', hasPreferences: true };

/** A signed-in page with a live data query, like the dashboard. */
function Page() {
  const data = useQuery({ queryKey: ['dashboard', 'prices'], queryFn: () => apiFetch('/dashboard/prices') });
  const logout = useLogout();
  return (
    <>
      <p>{data.isError ? 'card error' : 'dashboard page'}</p>
      <button onClick={() => logout.mutate()}>Log out</button>
    </>
  );
}

/** Fake API. `pricesStatus` lets a test make the data endpoint answer 401. */
function mockApi({ pricesStatus = 200 } = {}) {
  let signedIn = true;
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });
      if (url === '/api/auth/logout') {
        signedIn = false;
        return new Response(null, { status: 204 });
      }
      if (!signedIn) return json(401, { error: 'Not signed in' });
      if (url === '/api/auth/me') return json(200, { user });
      if (url === '/api/dashboard/prices') return json(pricesStatus, pricesStatus === 200 ? { coins: [] } : { error: 'Not signed in' });
      return json(404, {});
    }),
  );
}

function renderApp() {
  render(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/login" element={<p>login page</p>} />
          <Route element={<RequireAuth />}>
            <Route path="/" element={<Page />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => vi.unstubAllGlobals());

describe('signing out', () => {
  it('logout sends the user to /login (not a page of "Not signed in" cards)', async () => {
    mockApi();
    renderApp();
    fireEvent.click(await screen.findByRole('button', { name: 'Log out' }));
    expect(await screen.findByText('login page')).toBeInTheDocument();
    expect(screen.queryByText('card error')).not.toBeInTheDocument();
  });

  it('any 401 from the API (e.g. an expired session) also sends the user to /login', async () => {
    mockApi({ pricesStatus: 401 });
    renderApp();
    expect(await screen.findByText('login page')).toBeInTheDocument();
  });
});
