import { logger } from '@/utils/logger';

import React, { useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useUserProfile } from '@/hooks/useUserProfile';

import AppHeader from './AppHeader';
import SidebarContent from '@/components/Layout/SidebarContent';
import ResizableRightSidebar from './ResizableRightSidebar';
import PageLoader from './PageLoader';
import OnboardingCheck from './OnboardingCheck';

import { SidebarProvider } from '@/components/ui/sidebar';
import {
  ResizablePanelGroup,
  ResizablePanel,
} from '@/components/ui/resizable';

/**
 * Hovedlayout for hele app-skallet.
 * - Venstre kollapsbar sidebar (tekst + ikon-rail på 3.5 rem)
 * - Midtparti med sideinnhold (<Outlet /> fra React-Router)
 * - Høyre kontekst-sidebar kan aktiveres senere
 */
const AppLayout = () => {
  const { session } = useAuth();
  const { data: profile, isLoading: profileLoading } = useUserProfile();

  useEffect(() => {
    logger.log('AppLayout mounted, session:', !!session, 'profile loading:', profileLoading);
  }, [session, profileLoading]);

  /* --- Guard-flows ------------------------------------------------------- */
  if (!session) return <Navigate to="/auth" replace />;
  if (profileLoading) return <PageLoader />;
  if (!profile?.firstName || !profile?.lastName) return <OnboardingCheck />;
  /* ---------------------------------------------------------------------- */

  return (
    <SidebarProvider>
      <div className="flex flex-col min-h-screen w-full bg-background">
        <AppHeader />

        <ResizablePanelGroup
          direction="horizontal"
          className="flex w-full min-h-screen"
        >
          {/* VENSTRE – kollapsbar sidebar */}
          <ResizablePanel
            defaultSize={20}       /* ≈ 230 px */
            minSize={20}
            maxSize={20}
            collapsible
            collapsedSize={3.5}   /* 3.5 rem ikon-rail */
            className="bg-sidebar"
          >
            <SidebarContent />
          </ResizablePanel>

          {/* MIDT – hovedinnhold (ev. høyre sidebar senere) */}
          <ResizablePanel>
            <main className="flex flex-col w-full h-full overflow-auto">
              <Outlet />
            </main>

            {/**
              // Fjern kommentaren dersom/ når høyre kontekst-sidebar skal aktiveres
              <ResizableRightSidebar />
            */}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
