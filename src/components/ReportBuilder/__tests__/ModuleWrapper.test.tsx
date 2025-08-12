import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ModuleWrapper } from '../ModuleWrapper';
import { ViewModeProvider } from '../ViewModeContext';
import { WidgetManagerProvider } from '@/contexts/WidgetManagerContext';

beforeEach(() => {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  (global as any).ResizeObserver = ResizeObserverMock;
});

describe('ModuleWrapper', () => {
  it('toggles children when collapse button is clicked', () => {
    render(
      <WidgetManagerProvider>
        <ViewModeProvider>
          <ModuleWrapper id="module-1" title="Test">
            <div>Inner Widget</div>
          </ModuleWrapper>
        </ViewModeProvider>
      </WidgetManagerProvider>
    );

    expect(screen.getByText('Inner Widget')).toBeInTheDocument();
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.queryByText('Inner Widget')).not.toBeInTheDocument();
    fireEvent.click(button);
    expect(screen.getByText('Inner Widget')).toBeInTheDocument();
  });
});
