
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import AppHeader from './AppHeader';
import ResizableRightSidebar from './ResizableRightSidebar';
import { useRightSidebar } from './RightSidebarContext';

const AppLayout = () => {
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);
  const {
    isCollapsed: isRightSidebarCollapsed,
    setIsCollapsed,
    isHidden: isRightSidebarHidden,
    setIsHidden
  } = useRightSidebar();

  const toggleLeftSidebar = () => {
    setIsLeftSidebarCollapsed(!isLeftSidebarCollapsed);
  };

  const toggleRightSidebar = () => {
    setIsHidden(v => !v);
  };

  return (
    <div className="min-h-screen bg-background w-full flex flex-col">
      <AppHeader
        onToggleRightSidebar={toggleRightSidebar}
        isRightSidebarCollapsed={isRightSidebarCollapsed}
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
          {!isRightSidebarHidden && <ResizableRightSidebar />}
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
