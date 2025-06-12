
import React, { useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { ResizablePanelGroup, ResizablePanel } from '@/components/ui/resizable';
import Sidebar from './Sidebar';
import AppHeader from './AppHeader';
import RightSidebar from './RightSidebar';

interface AppLayoutProps {
  children: React.ReactNode;
}

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
    <div className="min-h-screen w-full bg-background flex flex-col">
      <SidebarProvider defaultOpen={true}>
        {/* Header - Fixed at top */}
        <div className="fixed top-0 left-0 right-0 z-50">
          <AppHeader />
        </div>
        
        {/* Main Layout Container */}
        <div className="flex flex-1 w-full pt-16">
          {/* Left Sidebar - Fixed position under header with proper width */}
          <div className="fixed left-0 top-16 h-[calc(100vh-64px)] z-40 w-[var(--sidebar-width)] group-data-[state=collapsed]:w-[var(--sidebar-width-collapsed)] transition-all duration-300">
            <Sidebar />
          </div>
          
          {/* Main Content Area - Uses proper margins and transitions */}
          <div className="flex-1 min-w-0 transition-all duration-300 ml-[var(--sidebar-width)] group-data-[state=collapsed]:ml-[var(--sidebar-width-collapsed)]">
            <ResizablePanelGroup direction="horizontal" className="h-[calc(100vh-64px)]">
              {/* Main Content Panel */}
              <ResizablePanel 
                defaultSize={100} 
                minSize={20}
                className="min-w-0"
                style={{ 
                  marginRight: isRightSidebarExpanded 
                    ? '85%' 
                    : isRightSidebarCollapsed 
                      ? '60px' 
                      : '350px' 
                }}
              >
                <main className="h-full overflow-auto bg-background p-6">
                  {children}
                </main>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>

          {/* Right Sidebar - Fixed position */}
          <div 
            className="fixed right-0 top-16 h-[calc(100vh-64px)] bg-background border-l border-border z-30 transition-all duration-300"
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
    </div>
  );
};

export default AppLayout;
