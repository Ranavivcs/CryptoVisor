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

/** A fake API: answers GET /me and /preferences/options, records the PUT. */
function mockApi() {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });
    if (url === '/api/auth/me') return json({ user: { id: 'u1', email: 'a@b.co', name: 'Ada', hasPreferences: false } });
    if (url === '/api/preferences/options') return json(options);
    if (url === '/api/preferences' && init?.method === 'PUT') return json({ preferences: JSON.parse(String(init.body)) });
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
});
