import { logger } from '@/utils/logger';

import React, { useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useUserProfile } from '@/hooks/useUserProfile';

import AppHeader from './AppHeader';
import ResizableRightSidebar from './ResizableRightSidebar';
import ResizableLeftSidebar from './ResizableLeftSidebar';
import PageLoader from './PageLoader';
import OnboardingCheck from './OnboardingCheck';

import { SidebarProvider } from '@/components/ui/sidebar';

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

        <div className="layout-container">
          <ResizableLeftSidebar />
          <div className="main-content flex flex-col overflow-auto">
            <Outlet />
          </div>
          {/**
            // Fjern kommentaren dersom/ når høyre kontekst-sidebar skal aktiveres
            <ResizableRightSidebar />
          */}
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
