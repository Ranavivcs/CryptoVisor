import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PricesSection } from './PricesSection';

const bitcoin = {
  id: 'bitcoin',
  symbol: 'BTC',
  name: 'Bitcoin',
  image: 'https://img.example/btc.png',
  priceUsd: 120,
  change24hPct: 2,
  lastUpdated: '2026-11-13T12:00:00.000Z',
  sparkline: [100, 80, 120],
  myVote: 0,
};

function renderPrices() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify({ source: 'live', coins: [bitcoin], movers: [] }), { status: 200 })),
  );
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <PricesSection />
    </QueryClientProvider>,
  );
}

afterEach(() => vi.unstubAllGlobals());

describe('PricesSection chart', () => {
  it('opens and closes the 7-day chart when the coin is clicked', async () => {
    renderPrices();
    const toggle = await screen.findByRole('button', { name: /bitcoin: show the 7-day chart/i });
    expect(screen.queryByRole('slider')).not.toBeInTheDocument();

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('7d high').nextSibling).toHaveTextContent('$120.00');
    expect(screen.getByText('7d low').nextSibling).toHaveTextContent('$80.00');
    expect(screen.getByText('7d change').nextSibling).toHaveTextContent('+20.0%');

    fireEvent.click(toggle);
    expect(screen.queryByRole('slider')).not.toBeInTheDocument();
  });

  it('moves through the points with the arrow keys', async () => {
    renderPrices();
    fireEvent.click(await screen.findByRole('button', { name: /bitcoin: show/i }));
    const chart = screen.getByRole('slider', { name: /bitcoin price over the last 7 days/i });

    expect(chart).toHaveAttribute('aria-valuenow', '2'); // starts at the latest point
    expect(chart).toHaveAttribute('aria-valuetext', 'Latest hourly: $120.00');

    fireEvent.keyDown(chart, { key: 'ArrowLeft' });
    expect(chart).toHaveAttribute('aria-valuenow', '1');
    expect(chart.getAttribute('aria-valuetext')).toMatch(/^~.*: \$80\.00$/);

    fireEvent.keyDown(chart, { key: 'Home' });
    fireEvent.keyDown(chart, { key: 'ArrowLeft' }); // can't go past the first point
    expect(chart).toHaveAttribute('aria-valuenow', '0');

    fireEvent.keyDown(chart, { key: 'ArrowRight' });
    fireEvent.keyDown(chart, { key: 'ArrowRight' }); // two quick presses both count
    expect(chart).toHaveAttribute('aria-valuenow', '2');
  });
});
