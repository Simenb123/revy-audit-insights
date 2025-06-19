
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import AppHeader from './AppHeader';
import Sidebar from './Sidebar';
import RightSidebar from './RightSidebar';
import MobileRightSidebar from './MobileRightSidebar';
import { useIsMobile } from '@/hooks/use-mobile';

const AppLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
  const [isMobileRightSidebarOpen, setIsMobileRightSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const toggleRightSidebar = () => {
    if (isMobile) {
      setIsMobileRightSidebarOpen(!isMobileRightSidebarOpen);
    } else {
      setIsRightSidebarCollapsed(!isRightSidebarCollapsed);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col w-full">
      {/* Global Header */}
      <AppHeader 
        onToggleRightSidebar={toggleRightSidebar}
        isRightSidebarCollapsed={isRightSidebarCollapsed}
      />
      
      {/* Main Layout Below Header */}
      <div className="flex-1 flex">
        {/* Left Sidebar */}
        <div className={`${isSidebarCollapsed ? 'w-16' : 'w-64'} transition-all duration-300 flex-shrink-0`}>
          <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>

        {/* Right Sidebar - Desktop only */}
        {!isMobile && (
          <div className={`${isRightSidebarCollapsed ? 'w-16' : 'w-80'} border-l border-border flex-shrink-0 transition-all duration-300`}>
            <RightSidebar 
              isCollapsed={isRightSidebarCollapsed} 
              onToggle={toggleRightSidebar} 
            />
          </div>
        )}
      </div>

      {/* Mobile Right Sidebar */}
      {isMobile && (
        <MobileRightSidebar
          isOpen={isMobileRightSidebarOpen}
          onClose={() => setIsMobileRightSidebarOpen(false)}
        />
      )}

      <Toaster />
    </div>
  );
};

export default AppLayout;
