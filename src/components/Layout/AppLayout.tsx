
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import AppHeader from './AppHeader';
import AssistantSidebar from './AssistantSidebar';
import { useMobileSidebar } from '@/hooks/use-mobile-sidebar';
import { useRightSidebar } from './RightSidebarContext';

const AppLayout = () => {
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);
  const { isCollapsed: isRightSidebarCollapsed, setIsCollapsed } = useRightSidebar();
  const { isMobileSidebarOpen, openMobileSidebar, closeMobileSidebar } = useMobileSidebar();

  const toggleLeftSidebar = () => {
    setIsLeftSidebarCollapsed(!isLeftSidebarCollapsed);
  };

  const toggleRightSidebar = () => {
    setIsCollapsed(v => !v);
  };

  return (
    <div className="min-h-screen bg-background w-full flex flex-col">
      <AppHeader
        onToggleRightSidebar={toggleRightSidebar}
        isRightSidebarCollapsed={isRightSidebarCollapsed}
        onOpenMobileSidebar={openMobileSidebar}
      />
      <div
        className="flex flex-1"
        style={{ height: "calc(100vh - var(--header-height))" }}
      >
        <Sidebar
          isCollapsed={isLeftSidebarCollapsed}
          onToggle={toggleLeftSidebar}
        />
        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
          <AssistantSidebar
            isMobileSidebarOpen={isMobileSidebarOpen}
            closeMobileSidebar={closeMobileSidebar}
          />
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
