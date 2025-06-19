
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
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [isMobileRightSidebarOpen, setIsMobileRightSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const toggleRightSidebar = () => {
    if (isMobile) {
      setIsMobileRightSidebarOpen(!isMobileRightSidebarOpen);
    } else {
      setIsRightSidebarOpen(!isRightSidebarOpen);
    }
  };

  return (
    <div className="min-h-screen bg-background flex w-full">
      {/* Left Sidebar - Fixed width based on collapsed state */}
      <div className={`${isSidebarCollapsed ? 'w-16' : 'w-64'} transition-all duration-300 flex-shrink-0`}>
        <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader 
          onToggleRightSidebar={toggleRightSidebar}
          isRightSidebarOpen={isRightSidebarOpen}
        />
        
        <div className="flex-1 flex">
          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>

          {/* Right Sidebar - Desktop only, fixed 300px width */}
          {!isMobile && isRightSidebarOpen && (
            <div className="w-80 border-l border-border flex-shrink-0">
              <RightSidebar onToggle={toggleRightSidebar} />
            </div>
          )}
        </div>
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
