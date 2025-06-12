
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
                defaultSize={isRightSidebarExpanded ? 20 : 70} 
                minSize={20}
                className={isRightSidebarExpanded ? "hidden lg:block" : ""}
              >
                <main className="h-full overflow-auto bg-background">
                  {children}
                </main>
              </ResizablePanel>
              
              {/* Resize Handle - only show when not collapsed and not expanded */}
              {!isRightSidebarCollapsed && !isRightSidebarExpanded && (
                <ResizableHandle withHandle className="w-2 bg-border hover:bg-accent transition-colors" />
              )}
              
              {/* Right Sidebar Panel */}
              <ResizablePanel 
                defaultSize={isRightSidebarExpanded ? 80 : 30} 
                minSize={isRightSidebarCollapsed ? 4 : 20}
                maxSize={isRightSidebarExpanded ? 80 : 50}
                className={`${isRightSidebarCollapsed ? 'w-16' : ''} ${isRightSidebarExpanded ? 'w-full' : ''}`}
              >
                <div className="h-full bg-background border-l border-border">
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
