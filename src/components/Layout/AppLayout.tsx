
import React, { useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
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

  // Calculate panel sizes based on right sidebar state
  const getMainPanelSize = () => {
    if (isRightSidebarExpanded) return 15; // Very small when expanded
    if (isRightSidebarCollapsed) return 85; // Larger when right sidebar is collapsed
    return 70; // Default size
  };

  const getRightPanelSize = () => {
    if (isRightSidebarExpanded) return 85; // Take most of the screen
    if (isRightSidebarCollapsed) return 15; // Small when collapsed
    return 30; // Default size
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      <SidebarProvider>
        {/* Header - Fixed at top */}
        <AppHeader />
        
        {/* Main Layout Container */}
        <div className="flex flex-1 w-full" style={{ height: 'calc(100vh - 64px)', marginTop: '64px' }}>
          {/* Left Sidebar */}
          <div className="flex-shrink-0 relative">
            <Sidebar />
          </div>
          
          {/* Resizable Content Area */}
          <div className="flex-1 min-w-0">
            <ResizablePanelGroup direction="horizontal" className="h-full">
              {/* Main Content Panel */}
              <ResizablePanel 
                defaultSize={getMainPanelSize()} 
                minSize={15}
                className={isRightSidebarExpanded ? "hidden lg:block" : ""}
              >
                <main className="h-full overflow-auto bg-background">
                  {children}
                </main>
              </ResizablePanel>
              
              {/* Resize Handle - only show when not collapsed and not fully expanded */}
              {!isRightSidebarCollapsed && !isRightSidebarExpanded && (
                <ResizableHandle withHandle className="w-2 bg-border hover:bg-accent transition-colors" />
              )}
              
              {/* Right Sidebar Panel */}
              <ResizablePanel 
                defaultSize={getRightPanelSize()}
                minSize={isRightSidebarCollapsed ? 4 : 20}
                maxSize={isRightSidebarExpanded ? 85 : 60}
                className="flex-shrink-0"
              >
                <div className={`h-full bg-background border-l border-border ${isRightSidebarCollapsed ? 'w-[60px]' : ''}`}>
                  <RightSidebar 
                    isCollapsed={isRightSidebarCollapsed}
                    isExpanded={isRightSidebarExpanded}
                    onToggle={toggleRightSidebar}
                    onToggleExpanded={toggleRightSidebarExpanded}
                  />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default AppLayout;
