import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RevisionProcess from '../RevisionProcess';

const mockResponse = {
  title: 'Planlegging',
  description: 'Detaljer om planlegging',
  checklistItems: ['Item 1', 'Item 2']
};

describe('RevisionProcess', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('henter og viser faseinnhold ved klikk', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    }) as any;

    render(<RevisionProcess clientId="123" progress={0} />);

    await userEvent.click(screen.getByText('Planlegging'));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Planlegging' })).toBeInTheDocument();
    });

    expect(screen.getByText('Detaljer om planlegging')).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith('/api/clients/123/revision/phases/planning');
  });
});
