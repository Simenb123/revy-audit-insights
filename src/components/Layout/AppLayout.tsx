import { logger } from '@/utils/logger';

import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useUserProfile } from '@/hooks/useUserProfile';
import AppHeader from './AppHeader';
import MainSidebar from './MainSidebar';
import AIAssistantSidebar from './AIAssistantSidebar';
import PageLoader from './PageLoader';
import OnboardingCheck from './OnboardingCheck';

const AppLayout = () => {
  const { session } = useAuth();
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);

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
    <div className="h-screen flex flex-col bg-gray-50">
      <AppHeader />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-64 flex-shrink-0">
          <MainSidebar />
        </div>
        
        {/* Main Content */}
        <div className="flex-1 overflow-auto bg-white">
          <main className="h-full">
            <Outlet />
          </main>
        </div>
        
        {/* Right Sidebar */}
        <AIAssistantSidebar 
          isCollapsed={rightSidebarCollapsed}
          onToggleCollapse={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
        />
      </div>
    </div>
  );
};

export default AppLayout;
