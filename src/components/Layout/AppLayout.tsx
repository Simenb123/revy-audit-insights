
import React, { useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
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
      <div className="min-h-screen flex w-full bg-background">
        {/* Left Sidebar */}
        <Sidebar />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header - Full Width */}
          <AppHeader onRightSidebarToggle={toggleRightSidebar} />
          
          {/* Content with Right Sidebar */}
          <div className="flex-1 flex overflow-hidden">
            {/* Main Content */}
            <main className="flex-1 overflow-auto">
              {children}
            </main>
            
            {/* Right Sidebar */}
            <div className={`transition-all duration-300 flex-shrink-0 ${
              isRightSidebarCollapsed ? 'w-0' : 'w-64'
            }`}>
              <RightSidebar 
                isCollapsed={isRightSidebarCollapsed}
                onToggle={toggleRightSidebar}
              />
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
