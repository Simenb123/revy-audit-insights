import { logger } from '@/utils/logger';

import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useUserProfile } from '@/hooks/useUserProfile';
import AppHeader from './AppHeader';
import Sidebar from './Sidebar';
import ResizableRightSidebar from './ResizableRightSidebar';
import PageLoader from './PageLoader';
import OnboardingCheck from './OnboardingCheck';
import { RightSidebarProvider } from './RightSidebarContext';

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
    <RightSidebarProvider>
      <div className="h-screen flex flex-col bg-background">
        <AppHeader />
        
        <div className="flex-1 overflow-hidden">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel 
              defaultSize={leftPanelSize} 
              minSize={15} 
              maxSize={30}
              onResize={setLeftPanelSize}
            >
              <Sidebar />
            </ResizablePanel>
            
            <ResizableHandle />
            
            <ResizablePanel defaultSize={50} minSize={30}>
              <main className="h-full overflow-auto">
                <Outlet />
              </main>
            </ResizablePanel>
            
            <ResizableHandle />
            
            <ResizableRightSidebar />
          </ResizablePanelGroup>
        </div>
      </div>
    </RightSidebarProvider>
  );
};

export default AppLayout;
