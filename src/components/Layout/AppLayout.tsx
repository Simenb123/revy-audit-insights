
import React, { useState } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import Sidebar from './Sidebar';
import AppHeader from './AppHeader';
import RightSidebar from './RightSidebar';
import RevyAssistant from '../Revy/RevyAssistant';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);

  const toggleRightSidebar = () => {
    setIsRightSidebarCollapsed(!isRightSidebarCollapsed);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar />
        <SidebarInset className="flex-1 flex flex-col">
          <AppHeader onRightSidebarToggle={toggleRightSidebar} />
          <main className="flex-1 overflow-auto p-0">
            {children}
          </main>
        </SidebarInset>
        <div className={`transition-all duration-300 ${isRightSidebarCollapsed ? 'w-0' : 'w-80'} flex-shrink-0`}>
          <RightSidebar 
            isCollapsed={isRightSidebarCollapsed}
            onToggle={toggleRightSidebar}
          />
        </div>
        
        {/* AI Assistant - floating mode */}
        <RevyAssistant />
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
