import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SectionCard } from './SectionCard';

/** A card whose content throws while rendering, like unexpected data from the API would. */
function BrokenCard() {
  const query = useQuery({ queryKey: ['broken'], queryFn: async () => ({ source: 'live' as const }) });
  return (
    <SectionCard title="Broken" query={query}>
      {() => {
        throw new Error('bad data');
      }}
    </SectionCard>
  );
}

afterEach(() => vi.restoreAllMocks());

describe('SectionCard', () => {
  it('shows an error with a retry inside the card when its content fails to render, instead of blanking the page', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {}); // React and the boundary log the caught error
    render(
      <QueryClientProvider client={new QueryClient()}>
        <BrokenCard />
        <p>the rest of the dashboard</p>
      </QueryClientProvider>,
    );
    expect(await screen.findByText('Something went wrong showing this section.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(screen.getByText('the rest of the dashboard')).toBeInTheDocument();
  });
});
