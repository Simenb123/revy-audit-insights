
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
    <div className="min-h-screen w-full bg-background flex flex-col">
      <SidebarProvider>
        {/* Header - Fixed at top with full width */}
        <AppHeader onRightSidebarToggle={toggleRightSidebar} />
        
        {/* Main Layout Container - Full width with proper flex layout */}
        <div className="flex flex-1 h-[calc(100vh-64px)] mt-16 w-full">
          {/* Left Sidebar */}
          <div className="flex-shrink-0">
            <Sidebar />
          </div>
          
          {/* Main Content Area - Takes remaining space */}
          <main className="flex-1 min-w-0 overflow-auto bg-background">
            {children}
          </main>
          
          {/* Right Sidebar - Fixed at far right */}
          <div className={`flex-shrink-0 bg-background border-l border-border transition-all duration-300 ease-in-out ${
            isRightSidebarCollapsed ? 'w-0 overflow-hidden' : 'w-64'
          }`}>
            <RightSidebar 
              isCollapsed={isRightSidebarCollapsed}
              onToggle={toggleRightSidebar}
            />
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default AppLayout;
