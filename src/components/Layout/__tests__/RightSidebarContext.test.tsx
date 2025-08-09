import { describe, it, expect, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RightSidebarProvider, useRightSidebar } from '../RightSidebarContext';

const WidthTestComponent = () => {
  const { width } = useRightSidebar();
  return <span data-testid="width">{width}</span>;
};

const CollapseTestComponent = () => {
  const { isCollapsed } = useRightSidebar();
  return <span data-testid="collapsed">{isCollapsed.toString()}</span>;
};

describe('RightSidebarProvider width initialization', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('clamps stored width above maximum to 600', () => {
    localStorage.setItem('rightSidebarWidth', '750');
    render(
      <RightSidebarProvider>
        <WidthTestComponent />
      </RightSidebarProvider>
    );
    expect(screen.getByTestId('width').textContent).toBe('600');
  });

  it('clamps stored width below minimum to 360', () => {
    localStorage.setItem('rightSidebarWidth', '100');
    render(
      <RightSidebarProvider>
        <WidthTestComponent />
      </RightSidebarProvider>
    );
    expect(screen.getByTestId('width').textContent).toBe('360');
  });

  it('is collapsed by default', () => {
    render(
      <RightSidebarProvider>
        <CollapseTestComponent />
      </RightSidebarProvider>
    );
    expect(screen.getByTestId('collapsed').textContent).toBe('true');
  });
});
