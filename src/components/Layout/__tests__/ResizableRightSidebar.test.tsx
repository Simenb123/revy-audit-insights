import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ResizableRightSidebar from '../ResizableRightSidebar';
import { RightSidebarProvider } from '../RightSidebarContext';

vi.mock('@/hooks/useIsMobile', () => ({
  useIsMobile: () => false
}));

vi.mock('@/hooks/useClientLookup', () => ({
  useClientLookup: () => ({ data: { id: 'uuid' } })
}));

vi.mock('@/hooks/useClientDocuments', () => ({
  useClientDocuments: () => ({
    documentsCount: 0,
    categoriesCount: 0,
    isLoading: false,
    error: null
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
  it('renders the AI-Revi assistant card when a client id is detected', () => {
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

    expect(screen.getByText('AI-Revi')).toBeInTheDocument();
  });
});
