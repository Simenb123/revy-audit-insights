
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
        {/* Header - Fixed at top with full width and proper z-index */}
        <AppHeader onRightSidebarToggle={toggleRightSidebar} />
        
        {/* Main Layout Container - Full width with proper flex layout */}
        <div className="flex flex-1 w-full" style={{ height: 'calc(100vh - 64px)', marginTop: '64px' }}>
          {/* Left Sidebar - Fixed width */}
          <div className="flex-shrink-0">
            <Sidebar />
          </div>
          
          {/* Main Content Area - Takes all remaining space */}
          <main className="flex-1 min-w-0 overflow-auto bg-background">
            <div className="h-full">
              {children}
            </div>
          </main>
          
          {/* Right Sidebar - Wider and better responsive */}
          <div className={`flex-shrink-0 bg-background border-l border-border transition-all duration-300 ease-in-out ${
            isRightSidebarCollapsed ? 'w-0 overflow-hidden' : 'w-80 lg:w-96'
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
