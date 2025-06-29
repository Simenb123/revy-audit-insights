import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RevisionWorkflow from '../Clients/ClientDetails/RevisionWorkflow';

vi.mock('@/hooks/useAuditActions', () => ({
  useClientAuditActions: vi.fn().mockReturnValue({ data: [] })
}));

describe('RevisionWorkflow', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('triggers onPhaseClick when a phase is selected', async () => {
    const onPhaseClick = vi.fn();
    render(
      <RevisionWorkflow
        currentPhase="overview"
        progress={0}
        clientId="123"
        onPhaseClick={onPhaseClick}
      />
    );

    expect(screen.getByText(/0% fullført/)).toBeInTheDocument();

    await userEvent.click(screen.getByText('Planlegging'));

    expect(onPhaseClick).toHaveBeenCalledWith('planning');
  });
});
