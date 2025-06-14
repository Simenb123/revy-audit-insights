import React, { useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import Sidebar from './Sidebar';
import AppHeader from './AppHeader';
import RightSidebar from './RightSidebar';

interface AppLayoutProps {
  children: React.ReactNode;
}

const HEADER_HEIGHT = 64; // 16 * 4px (h-16)

const AppLayout = ({ children }: AppLayoutProps) => {
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
  const [isRightSidebarExpanded, setIsRightSidebarExpanded] = useState(false);

  const toggleRightSidebar = () => {
    if (isRightSidebarExpanded) {
      setIsRightSidebarExpanded(false);
    } else {
      setIsRightSidebarCollapsed(!isRightSidebarCollapsed);
    }
  };

  const toggleRightSidebarExpanded = () => {
    setIsRightSidebarExpanded(!isRightSidebarExpanded);
    if (!isRightSidebarExpanded) {
      setIsRightSidebarCollapsed(false);
    }
  };

  // Calculate right sidebar width based on state
  const getRightSidebarWidth = () => {
    if (isRightSidebarExpanded) return '85%';
    if (isRightSidebarCollapsed) return '60px';
    return '350px'; // Default width
  };

  return (
    <SidebarProvider defaultOpen={true}>
      {/* Header på toppen, alltid fixed */}
      <AppHeader onRightSidebarToggle={toggleRightSidebar} />
      {/* Main content under header: flex row for sidebar/main/right-sidebar */}
      <div
        className="min-h-screen w-full flex flex-row bg-background pt-16"
        style={{ minHeight: `100vh` }}
      >
        {/* Venstre sidebar – sticky rett under header */}
        <Sidebar />
        {/* Hovedinnhold */}
        <div className="flex-1 min-w-0 relative">
          <main className="h-full overflow-auto bg-background p-6">
            {children}
          </main>
        </div>
        {/* Høyre sidebar */}
        <div 
          className="relative h-full bg-background border-l border-border z-30 transition-all duration-300"
          style={{ width: getRightSidebarWidth() }}
        >
          <RightSidebar 
            isCollapsed={isRightSidebarCollapsed}
            isExpanded={isRightSidebarExpanded}
            onToggle={toggleRightSidebar}
            onToggleExpanded={toggleRightSidebarExpanded}
          />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
