import { logger } from '@/utils/logger';

import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useUserProfile } from '@/hooks/useUserProfile';
import AppHeader from './AppHeader';
import ContextualSidebar from './ContextualSidebar';
import ResizableRightSidebar from './ResizableRightSidebar';
import PageLoader from './PageLoader';
import OnboardingCheck from './OnboardingCheck';
import { SidebarProvider } from '@/components/ui/sidebar';

const AppLayout = () => {
  const { session } = useAuth();
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const location = useLocation();
  const [leftPanelSize, setLeftPanelSize] = useState(20);

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
            <ResizablePanelGroup direction="horizontal" className="h-full">
              <ResizablePanel
                defaultSize={leftPanelSize}
                minSize={15}
                maxSize={30}
                onResize={setLeftPanelSize}
              >
                <ContextualSidebar />
              </ResizablePanel>


              <ResizablePanel defaultSize={50} minSize={30}>
                <main className="flex-1 min-h-screen overflow-y-auto">
                  <Outlet />
                </main>
              </ResizablePanel>

              <ResizableRightSidebar />
            </ResizablePanelGroup>
          </div>
        </div>
      </SidebarProvider>
  );
};

export default AppLayout;
