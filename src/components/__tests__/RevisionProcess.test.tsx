import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@testing-library/jest-dom';
import RevisionWorkflow from '../Clients/ClientDetails/RevisionWorkflow';

describe('RevisionWorkflow', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders phase names', () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <RevisionWorkflow currentPhase="overview" progress={0} />
      </QueryClientProvider>
    );
    expect(screen.getByText('Oversikt')).toBeInTheDocument();
    expect(screen.getByText('Planlegging')).toBeInTheDocument();
  });
});
