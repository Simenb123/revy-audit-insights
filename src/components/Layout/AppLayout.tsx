import { logger } from '@/utils/logger';

import React, { useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useUserProfile } from '@/hooks/useUserProfile';
import AppHeader from './AppHeader';
import ResizableRightSidebar from './ResizableRightSidebar';
import PageLoader from './PageLoader';
import OnboardingCheck from './OnboardingCheck';
import { SidebarProvider, SidebarContent } from '@/components/ui/sidebar';
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
      <AppHeader />

      <div className="flex-1 min-h-screen bg-background">
      <ResizablePanelGroup direction="horizontal" className="flex w-full min-h-screen">

        {/* VENSTRE – ikon-/tekst-sidebar */}
        <ResizablePanel
          defaultSize={20}   // ≈ 230 px
          minSize={20}
          maxSize={20}
          collapsible
          collapsedSize={3.5} // 3.5 %  (eller regn det om til px)
        >
          <SidebarContent />
        </ResizablePanel>

        {/* MIDT – hovedinnhold */}
        <div className="flex-1 overflow-y-auto">
          <main className="flex flex-col w-full min-h-screen">
            <Outlet /> {/* sideinnhold fra React-Router */}
          </main>
        </div>


        {/* HØYRE – kontekst-sidebar (valgfritt) */}
        {/* <ResizableRightSidebar /> */}
      </ResizablePanelGroup>
    </div>
    </SidebarProvider>
  );
};

export default AppLayout;