
import React, { useState } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import Sidebar from './Sidebar';
import AppHeader from './AppHeader';
import RightSidebar from './RightSidebar';

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
      <div className="min-h-screen flex w-full bg-sidebar">
        <Sidebar />
        <SidebarInset className="flex-1">
          <AppHeader onRightSidebarToggle={toggleRightSidebar} />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto">
              {children}
            </div>
          </main>
        </SidebarInset>
        <div className={`transition-all duration-300 ${isRightSidebarCollapsed ? 'w-0' : 'w-80'}`}>
          <RightSidebar 
            isCollapsed={isRightSidebarCollapsed}
            onToggle={toggleRightSidebar}
          />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
