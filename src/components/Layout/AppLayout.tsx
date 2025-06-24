
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import AppHeader from './AppHeader';
import ResizableRightSidebar from './ResizableRightSidebar';

const AppLayout = () => {
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);

  const toggleRightSidebar = () => {
    setIsRightSidebarCollapsed(!isRightSidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-background w-full">
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AppHeader />
          <div className="flex-1 flex overflow-hidden">
            <main className="flex-1 overflow-y-auto">
              <Outlet />
            </main>
            <ResizableRightSidebar 
              isCollapsed={isRightSidebarCollapsed}
              onToggle={toggleRightSidebar}
              initialWidth={320}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
