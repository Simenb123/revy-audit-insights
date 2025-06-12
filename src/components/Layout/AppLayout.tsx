
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

  // Calculate available width for main content
  const getMainContentStyle = () => {
    const rightSidebarWidth = getRightSidebarWidth();
    if (isRightSidebarExpanded) {
      return { marginRight: rightSidebarWidth };
    }
    if (isRightSidebarCollapsed) {
      return { marginRight: '60px' };
    }
    return { marginRight: '350px' };
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      <SidebarProvider defaultOpen={true}>
        {/* Header - Fixed at top */}
        <AppHeader />
        
        {/* Main Layout Container */}
        <div className="flex flex-1 w-full relative" style={{ height: 'calc(100vh - 64px)', marginTop: '64px' }}>
          {/* Left Sidebar */}
          <div className="flex-shrink-0 relative z-10">
            <Sidebar />
          </div>
          
          {/* Main Content Area with Resizable Panels */}
          <div className="flex-1 min-w-0 transition-all duration-300" style={getMainContentStyle()}>
            <ResizablePanelGroup direction="horizontal" className="h-full">
              {/* Main Content Panel */}
              <ResizablePanel 
                defaultSize={100} 
                minSize={20}
                className="min-w-0"
              >
                <main className="h-full overflow-auto bg-background">
                  {children}
                </main>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>

          {/* Right Sidebar - Fixed position, outside ResizablePanelGroup */}
          <div 
            className="fixed right-0 top-16 h-[calc(100vh-64px)] bg-background border-l border-border z-20 transition-all duration-300"
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
