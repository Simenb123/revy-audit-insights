import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import RevisionWorkflow from '../Clients/ClientDetails/RevisionWorkflow';

describe('RevisionWorkflow', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders phase names', () => {
    render(<RevisionWorkflow currentPhase="overview" progress={0} />);
    expect(screen.getByText('Oversikt')).toBeInTheDocument();
    expect(screen.getByText('Planlegging')).toBeInTheDocument();
  });
});
