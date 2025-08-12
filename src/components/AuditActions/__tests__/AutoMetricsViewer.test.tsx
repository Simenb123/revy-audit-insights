import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import AutoMetricsViewer from '../AutoMetricsViewer';

describe('AutoMetricsViewer', () => {
  it('viser JSON-representasjon av metrics', () => {
    const metrics = { score: 92, notes: ['ok', 'needs review'] };
    render(<AutoMetricsViewer metrics={metrics} />);

    expect(screen.getByText('Auto-metrics (lesevisning)')).toBeInTheDocument();
    const pre = screen.getByText((_, el) => el?.tagName.toLowerCase() === 'pre' && el.textContent?.includes('score'));
    expect(pre).toBeInTheDocument();
    expect(pre).toHaveTextContent('92');
    expect(pre).toHaveTextContent('needs review');
  });
});
