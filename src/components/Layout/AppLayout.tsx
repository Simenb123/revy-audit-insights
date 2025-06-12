
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
    <div className="min-h-screen w-full bg-background">
      <SidebarProvider>
        {/* Header - Fixed at top with full width */}
        <AppHeader onRightSidebarToggle={toggleRightSidebar} />
        
        {/* Main Layout Container */}
        <div className="flex h-[calc(100vh-64px)] mt-16 w-full">
          {/* Left Sidebar */}
          <div className="flex-shrink-0">
            <Sidebar />
          </div>
          
          {/* Main Content Area */}
          <div className="flex-1 flex min-w-0 overflow-hidden">
            {/* Primary Content */}
            <main className="flex-1 overflow-auto bg-background">
              {children}
            </main>
            
            {/* Right Sidebar */}
            <div className={`transition-all duration-300 ease-in-out flex-shrink-0 bg-background border-l border-border ${
              isRightSidebarCollapsed ? 'w-0' : 'w-64'
            }`}>
              <RightSidebar 
                isCollapsed={isRightSidebarCollapsed}
                onToggle={toggleRightSidebar}
              />
            </div>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default AppLayout;
