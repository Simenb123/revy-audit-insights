import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar'
import AppHeader from './AppHeader'
import AssistantSidebar from '../RightSidebar/AssistantSidebar'
import { ChatUIProvider } from '@/store/chatUI'

const AppLayout = () => {
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);


  const toggleLeftSidebar = () => {
    setIsLeftSidebarCollapsed(!isLeftSidebarCollapsed);
  };

  return (
    <ChatUIProvider>
      <div className="min-h-screen bg-background grid grid-cols-[auto_1fr_auto] grid-rows-[auto_1fr]">
        <AppHeader className="col-span-3" />
        <div
          className="grid grid-cols-[auto_1fr] lg:grid-cols-[auto_1fr_auto] flex-1"
          style={{ height: 'calc(100vh - var(--header-height))' }}
        >
          <Sidebar
            isCollapsed={isLeftSidebarCollapsed}
            onToggle={toggleLeftSidebar}
          />
          <main className="overflow-y-auto">
            <Outlet />
          </main>
          <AssistantSidebar />
        </div>
      </div>
    </ChatUIProvider>
  );
};

export default AppLayout;
