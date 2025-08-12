import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ActionDrawerHeader from '../ActionDrawerHeader';

describe('ActionDrawerHeader', () => {
  it('viser tittel og undertittel', () => {
    render(
      <ActionDrawerHeader action={null} title="Rediger handling" subtitle="Oppdater detaljer" />
    );

    expect(screen.getByText('Rediger handling')).toBeInTheDocument();
    expect(screen.getByText('Oppdater detaljer')).toBeInTheDocument();
  });

  it('viser fase og status når action finnes', () => {
    const action: any = { phase: 'planlegging', status: 'not_started' };

    render(
      <ActionDrawerHeader action={action} title="Tittel" subtitle="Sub" />
    );

    expect(screen.getByText(/Fase: planlegging · Status: not_started/)).toBeInTheDocument();
  });
});
