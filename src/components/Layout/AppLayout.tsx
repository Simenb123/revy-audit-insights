
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import AppHeader from './AppHeader';
import ResizableRightSidebar from './ResizableRightSidebar';

const AppLayout = () => {
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
  const [rightSidebarWidth, setRightSidebarWidth] = useState(320);

  const toggleLeftSidebar = () => {
    setIsLeftSidebarCollapsed(!isLeftSidebarCollapsed);
  };

  const toggleRightSidebar = () => {
    setIsRightSidebarCollapsed(!isRightSidebarCollapsed);
  };

  const handleRightSidebarWidthChange = (newWidth: number) => {
    setRightSidebarWidth(newWidth);
  };

  return (
    <div className="min-h-screen bg-background w-full flex flex-col">
      <AppHeader
        onToggleRightSidebar={toggleRightSidebar}
        isRightSidebarCollapsed={isRightSidebarCollapsed}
      />
      <div className="flex flex-1">
        <Sidebar
          isCollapsed={isLeftSidebarCollapsed}
          onToggle={toggleLeftSidebar}
        />
        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
          <ResizableRightSidebar
            isCollapsed={isRightSidebarCollapsed}
            onToggle={toggleRightSidebar}
            initialWidth={rightSidebarWidth}
            onWidthChange={handleRightSidebarWidthChange}
          />
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
