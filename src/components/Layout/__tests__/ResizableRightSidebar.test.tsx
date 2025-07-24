import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ResizableRightSidebar from '../ResizableRightSidebar';
import { RightSidebarProvider } from '../RightSidebarContext';

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
  it('renders the AI-Revy assistant card when a client id is detected', () => {
    const queryClient = new QueryClient();
    render(
      <MemoryRouter initialEntries={[ '/clients/acme-inc' ]}>
        <QueryClientProvider client={queryClient}>
          <RightSidebarProvider>
            <ResizableRightSidebar />
          </RightSidebarProvider>
        </QueryClientProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('AI-Revy')).toBeInTheDocument();
  });

  it('renders the admin assistant on admin pages', () => {
    const queryClient = new QueryClient();
    useClientLookupMock.mockReturnValueOnce({ data: undefined });
    render(
      <MemoryRouter initialEntries={['/ai-revy-admin']}>
        <QueryClientProvider client={queryClient}>
          <RightSidebarProvider>
            <ResizableRightSidebar />
          </RightSidebarProvider>
        </QueryClientProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Admin Assistent')).toBeInTheDocument();
  });

  it('renders the general assistant when no client id is present', () => {
    const queryClient = new QueryClient();
    useClientLookupMock.mockReturnValueOnce({ data: undefined });
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <QueryClientProvider client={queryClient}>
          <RightSidebarProvider>
            <ResizableRightSidebar />
          </RightSidebarProvider>
        </QueryClientProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('AI Assistent')).toBeInTheDocument();
  });
});
