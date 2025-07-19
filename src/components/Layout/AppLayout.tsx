
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
 * - Fast sticky header på toppen
 * - Venstre kollapsbar sidebar (tekst + ikon-rail på 3.5 rem)
 * - Midtparti med sideinnhold (<Outlet /> fra React-Router)
 * - Høyre kontekst-sidebar kan aktiveres senere
 */
const AppLayout = () => {
  const { session, connectionStatus, isLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useUserProfile();

  useEffect(() => {
    logger.log('AppLayout mounted, session:', !!session, 'profile loading:', profileLoading, 'connection:', connectionStatus);
  }, [session, profileLoading, connectionStatus]);

  /* --- Guard-flows ------------------------------------------------------- */
  
  // If still loading auth, show loader
  if (isLoading) return <PageLoader message="Laster autentisering..." />;
  
  // If no connection to Supabase, allow demo mode
  if (connectionStatus === 'disconnected') {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <AppHeader />
        <SidebarProvider>
          <div className="flex flex-1 min-h-0">
            <ResizableLeftSidebar />
            <main className="flex-1 overflow-auto">
              <div className="p-4 bg-yellow-50 border-b border-yellow-200">
                <p className="text-sm text-yellow-800">
                  Demo-modus: Appen kjører uten tilkobling til backend.
                </p>
              </div>
              <Outlet />
            </main>
            <ResizableRightSidebar />
          </div>
        </SidebarProvider>
      </div>
    );
  }
  
  // If no session but connected, redirect to auth
  if (!session && connectionStatus === 'connected') {
    return <Navigate to="/auth" replace />;
  }
  
  // If loading profile, show loader
  if (profileLoading) return <PageLoader message="Laster brukerprofil..." />;
  
  // If missing profile data, show onboarding
  if (session && (!profile?.firstName || !profile?.lastName)) {
    return <OnboardingCheck />;
  }
  /* ---------------------------------------------------------------------- */

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />
      <SidebarProvider>
        <div className="flex flex-1 min-h-0">
          <ResizableLeftSidebar />
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
          <ResizableRightSidebar />
        </div>
      </SidebarProvider>
    </div>
  );
};

export default AppLayout;
