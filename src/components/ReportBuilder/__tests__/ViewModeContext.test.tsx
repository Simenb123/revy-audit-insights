import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ViewModeProvider, useViewMode } from '../ViewModeContext';

function TestComponent() {
  const { isViewMode, toggleViewMode } = useViewMode();
  return (
    <div>
      <span data-testid="mode">{isViewMode ? 'view' : 'edit'}</span>
      <button onClick={toggleViewMode}>toggle</button>
    </div>
  );
}

describe('useViewMode', () => {
  it('reflects mode changes when toggled', () => {
    render(
      <ViewModeProvider>
        <TestComponent />
      </ViewModeProvider>
    );

    expect(screen.getByTestId('mode').textContent).toBe('edit');
    fireEvent.click(screen.getByText('toggle'));
    expect(screen.getByTestId('mode').textContent).toBe('view');
    fireEvent.click(screen.getByText('toggle'));
    expect(screen.getByTestId('mode').textContent).toBe('edit');
  });
});
