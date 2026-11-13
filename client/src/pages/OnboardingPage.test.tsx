import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OnboardingPage } from './OnboardingPage';

const options = {
  coins: [
    { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
    { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  ],
  investorTypes: [{ value: 'HODLER', label: 'HODLer', description: 'Buy and hold' }],
  contentTypes: [{ value: 'FUN', label: 'Fun', description: 'Memes' }],
};

const saved = { assets: ['bitcoin'], investorType: 'HODLER', contentTypes: ['FUN'], updatedAt: '2026-11-12T10:00:00Z' };

/**
 * A fake API: answers GET /me, /preferences/options and /preferences, records the PUT.
 * `existing` = a user who already finished onboarding and opened "Edit preferences".
 */
function mockApi({ existing = false } = {}) {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });
    if (url === '/api/auth/me') return json({ user: { id: 'u1', email: 'a@b.co', name: 'Ada', hasPreferences: existing } });
    if (url === '/api/preferences/options') return json(options);
    if (url === '/api/preferences' && init?.method === 'PUT') return json({ preferences: JSON.parse(String(init.body)) });
    if (url === '/api/preferences') return json({ preferences: existing ? saved : null });
    return new Response('{}', { status: 404 });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function renderQuiz() {
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={['/onboarding']}>
        <Routes>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/" element={<p>dashboard page</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const nextButton = () => screen.getByRole('button', { name: /next|show my dashboard/i });

afterEach(() => vi.unstubAllGlobals());

describe('OnboardingPage', () => {
  it('only lets you continue once the current question is answered', async () => {
    mockApi();
    renderQuiz();

    fireEvent.click(await screen.findByRole('button', { name: /bitcoin/i }));
    expect(nextButton()).toBeEnabled();

    // Un-selecting the only coin makes the step unanswered again.
    fireEvent.click(screen.getByRole('button', { name: /bitcoin/i }));
    expect(nextButton()).toBeDisabled();
  });

  it('saves all three answers in one request and opens the dashboard', async () => {
    const fetchMock = mockApi();
    renderQuiz();

    fireEvent.click(await screen.findByRole('button', { name: /ethereum/i }));
    fireEvent.click(nextButton());
    fireEvent.click(screen.getByRole('button', { name: /hodler/i }));
    fireEvent.click(nextButton());
    fireEvent.click(screen.getByRole('button', { name: /fun/i }));
    fireEvent.click(nextButton());

    expect(await screen.findByText('dashboard page')).toBeInTheDocument();
    const put = fetchMock.mock.calls.find(([, init]) => init?.method === 'PUT');
    await waitFor(() => expect(put).toBeDefined());
    expect(JSON.parse(String(put![1]!.body))).toEqual({
      assets: ['ethereum'],
      investorType: 'HODLER',
      contentTypes: ['FUN'],
    });
  });

  it('starts empty for a new user, with Back disabled on the first step', async () => {
    mockApi();
    renderQuiz();

    expect(await screen.findByRole('button', { name: /bitcoin/i })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: /^back$/i })).toBeDisabled();
  });

  it('when editing, shows the saved answers and Back returns to the dashboard', async () => {
    mockApi({ existing: true });
    renderQuiz();

    expect(await screen.findByRole('button', { name: /bitcoin/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /ethereum/i })).toHaveAttribute('aria-pressed', 'false');
    expect(nextButton()).toBeEnabled(); // already answered

    fireEvent.click(screen.getByRole('button', { name: /back to dashboard/i }));
    expect(await screen.findByText('dashboard page')).toBeInTheDocument();
  });
});
