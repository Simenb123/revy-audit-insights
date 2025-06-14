
import React, { useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import Sidebar from './Sidebar';
import AppHeader from './AppHeader';
import RightSidebar from './RightSidebar';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
  const [isRightSidebarExpanded, setIsRightSidebarExpanded] = useState(false);

  const toggleRightSidebar = () => {
    const willBeCollapsed = !isRightSidebarCollapsed;
    setIsRightSidebarCollapsed(willBeCollapsed);
    if (willBeCollapsed) {
      setIsRightSidebarExpanded(false);
    }
  };

  const toggleRightSidebarExpanded = () => {
    const willBeExpanded = !isRightSidebarExpanded;
    setIsRightSidebarExpanded(willBeExpanded);
    if (willBeExpanded) {
      setIsRightSidebarCollapsed(false);
    }
  };

  const rightSidebarComponent = (
    <RightSidebar 
      isCollapsed={isRightSidebarCollapsed}
      isExpanded={isRightSidebarExpanded}
      onToggle={toggleRightSidebar}
      onToggleExpanded={toggleRightSidebarExpanded}
    />
  );

  return (
    <SidebarProvider defaultOpen={true}>
      <AppHeader onRightSidebarToggle={toggleRightSidebar} />
      <div
        className="min-h-screen w-full flex flex-row bg-background relative z-10"
        style={{ 
          minHeight: `100vh`,
          paddingTop: '4rem' // Gi plass til fixed header
        }}
      >
        <div className="relative z-20 h-full">
          <Sidebar />
        </div>
        
        {isRightSidebarCollapsed ? (
          <>
            <div className="flex-1 min-w-0 relative z-10">
              <main className="h-full overflow-auto bg-background p-6">
                {children}
              </main>
            </div>
            <div 
              className="relative h-full bg-background border-l border-border z-30"
              style={{ width: '60px' }}
            >
              {rightSidebarComponent}
            </div>
          </>
        ) : (
          <ResizablePanelGroup
            direction="horizontal"
            className="flex-1 min-w-0 h-full"
            key={isRightSidebarExpanded ? 'expanded' : 'normal'}
          >
            <ResizablePanel defaultSize={isRightSidebarExpanded ? 15 : 65} minSize={20}>
              <main className="h-full overflow-auto bg-background p-6">
                {children}
              </main>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel 
              defaultSize={isRightSidebarExpanded ? 85 : 35} 
              minSize={isRightSidebarExpanded ? 80 : 25}
            >
              {rightSidebarComponent}
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
