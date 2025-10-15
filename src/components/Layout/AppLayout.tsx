
import { logger } from '@/utils/logger';

import React, { useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useUserProfile } from '@/hooks/useUserProfile';

import GlobalHeader from './GlobalHeader';
import ResizableRightSidebar from './ResizableRightSidebar';
import ResizableLeftSidebar from './ResizableLeftSidebar';
import ResponsiveLayout from './ResponsiveLayout';
import GridLayoutContainer from './GridLayoutContainer';
import PageLoader from './PageLoader';
import OnboardingCheck from './OnboardingCheck';

import { SidebarProvider } from '@/components/ui/sidebar';
import { LayoutProvider } from './LayoutContext';
import { PageTitleProvider } from './PageTitleContext';
import { SubHeaderProvider } from './SubHeaderContext';
import SubHeaderHost from './SubHeaderHost';

/**
 * AppLayout - Root layout component for entire application
 * 
 * @description
 * Main application shell that provides authentication guards, context providers,
 * and the core layout structure (headers, sidebars, main content area).
 * 
 * @responsibilities
 * 1. Authentication guard (redirect to /auth if no session)
 * 2. Profile loading and onboarding check
 * 3. Context providers setup (Layout, PageTitle, SubHeader, Sidebar)
 * 4. Root grid structure (GlobalHeader + SubHeader + GridLayoutContainer)
 * 
 * @structure
 * ```
 * <LayoutProvider>           ← Measures header heights via ResizeObserver
 *   <PageTitleProvider>       ← Manages global page title
 *     <SubHeaderProvider>     ← Manages dynamic subheader content
 *       <GlobalHeader />      ← Nivå 1: Top navigation (z-50)
 *       <SubHeaderHost />     ← Nivå 2: Context-specific header (z-40)
 *       <SidebarProvider>     ← Manages left sidebar state
 *         <GridLayoutContainer>  ← CSS Grid: left-sidebar | main | right-sidebar
 *           <ResizableLeftSidebar />   ← Navigation sidebar (z-30)
 *           <ResponsiveLayout>          ← Main content area
 *             <Outlet />                 ← React Router outlet
 *           </ResponsiveLayout>
 *           <ResizableRightSidebar />   ← AI/Chat sidebar (z-10)
 * ```
 * 
 * @authentication-flow
 * 1. isLoading → PageLoader
 * 2. connectionStatus === 'disconnected' → Demo mode
 * 3. !session → Navigate('/auth')
 * 4. profileLoading → PageLoader
 * 5. !profile.firstName → OnboardingCheck
 * 6. Success → Render full layout
 * 
 * @see {@link https://docs/design/ui-architecture.md} - Full UI architecture
 * @see {@link https://docs/design/layout-architecture.md} - Header hierarchy
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
        <LayoutProvider>
          <PageTitleProvider>
            <SubHeaderProvider>
              <div className="h-screen overflow-hidden bg-background flex flex-col">
                <GlobalHeader />
                <SubHeaderHost />
                <SidebarProvider>
                  <GridLayoutContainer>
                    <ResizableLeftSidebar />
                    <ResponsiveLayout maxWidth="full">
                      <div className="p-3 bg-yellow-50 border-b border-yellow-200">
                        <p className="text-sm text-yellow-800">
                          Demo-modus: Appen kjører uten tilkobling til backend.
                        </p>
                      </div>
                      <Outlet />
                    </ResponsiveLayout>
                    <ResizableRightSidebar />
                  </GridLayoutContainer>
                </SidebarProvider>
              </div>
            </SubHeaderProvider>
          </PageTitleProvider>
        </LayoutProvider>
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
    <LayoutProvider>
      <PageTitleProvider>
        <SubHeaderProvider>
          <div className="h-screen overflow-hidden bg-background flex flex-col">
            <GlobalHeader />
            <SubHeaderHost />
            <SidebarProvider>
              <GridLayoutContainer>
                <ResizableLeftSidebar />
                <ResponsiveLayout maxWidth="full">
                  <Outlet />
                </ResponsiveLayout>
                <ResizableRightSidebar />
              </GridLayoutContainer>
            </SidebarProvider>
          </div>
        </SubHeaderProvider>
      </PageTitleProvider>
    </LayoutProvider>
  );
};

export default AppLayout;
