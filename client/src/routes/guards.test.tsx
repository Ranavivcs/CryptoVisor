import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RequireAuth } from './guards';

/** Renders the guard at `path` with the given /auth/me response. */
function renderAt(path: string, meResponse: { status: number; body: unknown }) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response(JSON.stringify(meResponse.body), { status: meResponse.status })),
  );
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<p>login page</p>} />
          <Route element={<RequireAuth />}>
            <Route path="/" element={<p>dashboard page</p>} />
            <Route path="/onboarding" element={<p>onboarding page</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const user = { id: 'u1', email: 'a@b.co', name: 'A' };

afterEach(() => vi.unstubAllGlobals());

describe('RequireAuth', () => {
  it('sends guests to /login', async () => {
    renderAt('/', { status: 401, body: { error: 'Not signed in' } });
    expect(await screen.findByText('login page')).toBeInTheDocument();
  });

  it('sends users who have not onboarded to /onboarding', async () => {
    renderAt('/', { status: 200, body: { user: { ...user, hasPreferences: false } } });
    expect(await screen.findByText('onboarding page')).toBeInTheDocument();
  });

  it('lets onboarded users see the dashboard', async () => {
    renderAt('/', { status: 200, body: { user: { ...user, hasPreferences: true } } });
    expect(await screen.findByText('dashboard page')).toBeInTheDocument();
  });
});
