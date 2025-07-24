import { describe, it, expect, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RightSidebarProvider, useRightSidebar } from '../RightSidebarContext';

const TestComponent = () => {
  const { width } = useRightSidebar();
  return <span data-testid="width">{width}</span>;
};

describe('RightSidebarProvider width initialization', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('clamps stored width above maximum to 600', () => {
    localStorage.setItem('rightSidebarWidth', '750');
    render(
      <RightSidebarProvider>
        <TestComponent />
      </RightSidebarProvider>
    );
    expect(screen.getByTestId('width').textContent).toBe('600');
  });

  it('clamps stored width below minimum to 320', () => {
    localStorage.setItem('rightSidebarWidth', '100');
    render(
      <RightSidebarProvider>
        <TestComponent />
      </RightSidebarProvider>
    );
    expect(screen.getByTestId('width').textContent).toBe('320');
  });
});
