import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ResizableRightSidebar from '../ResizableRightSidebar';
import { RightSidebarProvider } from '../RightSidebarContext';
import { LayoutContext } from '../LayoutContext';

vi.mock('@/hooks/useIsMobile', () => ({
  useIsMobile: () => false
}));

const useClientLookupMock = vi.fn().mockReturnValue({ data: { id: 'uuid' } });
vi.mock('@/hooks/useClientLookup', () => ({
  useClientLookup: (...args: any[]) => useClientLookupMock(...args)
}));

vi.mock('@/hooks/useClientDocuments', () => ({
  useClientDocuments: () => ({
    documentsCount: 0,
    categoriesCount: 0,
    isLoading: false,
    error: null as Error | null
  })
}));

vi.mock('@/hooks/useClientDetails', () => ({
  useClientDetails: () => ({
    data: { id: 'uuid', phase: 'overview', progress: 0 }
  })
}));

vi.mock('@/hooks/useUserProfile', () => ({
  useUserProfile: () => ({ data: { userRole: 'employee' } })
}));

describe('ResizableRightSidebar', () => {
  beforeEach(() => {
    useClientLookupMock.mockReturnValue({ data: { id: 'uuid' } });
  });
  const renderSidebar = (path: string, subHeaderHeight = 0) => {
    const queryClient = new QueryClient();
    render(
      <MemoryRouter initialEntries={[path]}>
        <QueryClientProvider client={queryClient}>
          <LayoutContext.Provider value={{ globalHeaderHeight: 48, subHeaderHeight }}>
            <RightSidebarProvider>
              <ResizableRightSidebar />
            </RightSidebarProvider>
          </LayoutContext.Provider>
        </QueryClientProvider>
      </MemoryRouter>
    );
  };

  it('renders the AI-Revy assistant card when a client id is detected', () => {
    renderSidebar('/clients/acme-inc');
    expect(screen.getByText('AI-Revy')).toBeInTheDocument();
  });

  it('renders the admin assistant on admin pages', () => {
    useClientLookupMock.mockReturnValueOnce({ data: undefined });
    renderSidebar('/ai-revy-admin');
    expect(screen.getByText('Admin Assistent')).toBeInTheDocument();
  });

  it('renders the general assistant when no client id is present', () => {
    useClientLookupMock.mockReturnValueOnce({ data: undefined });
    renderSidebar('/dashboard');
    expect(screen.getByText('AI Assistent')).toBeInTheDocument();
  });

  it('aligns with the global header when no sub-header is present', () => {
    useClientLookupMock.mockReturnValueOnce({ data: undefined });
    renderSidebar('/dashboard', 0);
    const sidebar = screen.getByTestId('right-sidebar');
    expect(sidebar).toHaveStyle({ top: '48px', height: 'calc(100vh - 48px)' });
  });

  it('offsets for sub-header height when present', () => {
    useClientLookupMock.mockReturnValueOnce({ data: undefined });
    renderSidebar('/dashboard', 40);
    const sidebar = screen.getByTestId('right-sidebar');
    expect(sidebar).toHaveStyle({ top: '88px', height: 'calc(100vh - 88px)' });
  });
});
