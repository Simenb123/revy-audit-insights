import { logger } from '@/utils/logger';

import React, { useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useUserProfile } from '@/hooks/useUserProfile';
import AppHeader from './AppHeader';
import ContextualSidebar from './ContextualSidebar';
import ResizableRightSidebar from './ResizableRightSidebar';
import PageLoader from './PageLoader';
import OnboardingCheck from './OnboardingCheck';
import { SidebarProvider } from '@/components/ui/sidebar';
import {
  ResizablePanelGroup,
  ResizablePanel,
} from '@/components/ui/resizable';

const AppLayout = () => {
  const { session } = useAuth();
  const { data: profile, isLoading: profileLoading } = useUserProfile();

  useEffect(() => {
    logger.log('AppLayout mounted, session:', !!session, 'profile loading:', profileLoading);
  }, [session, profileLoading]);

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  if (profileLoading) {
    return <PageLoader />;
  }

  if (!profile?.firstName || !profile?.lastName) {
    return <OnboardingCheck />;
  }

  return (
    <SidebarProvider>
      <div className="flex flex-col min-h-screen w-full bg-background">
        <AppHeader />

        <div className="flex-1 overflow-y-auto">
          <ResizablePanelGroup
            direction="horizontal"
            className="flex w-full min-h-screen"
          >
            <ResizablePanel
              defaultSize={20}
              minSize={20}
              maxSize={20}
              collapsible
              collapsedSize={3.5}
            >
              <ContextualSidebar />
            </ResizablePanel>
            <ResizablePanel>
              <div className="flex w-full h-full">
                <main className="flex-1 h-full overflow-auto">
                  <Outlet />
                </main>
                <ResizableRightSidebar />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
