
import React, { ReactNode, useState } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import AppHeader from './AppHeader';
import Sidebar from './Sidebar';
import RightSidebar from './RightSidebar';
import { TooltipProvider } from '@/components/ui/tooltip';

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <Sidebar />
          <SidebarInset className="flex-1">
            <div className="flex flex-col h-screen w-full">
              {/* Fixed header */}
              <AppHeader />
              
              {/* Resizable content area */}
              <ResizablePanelGroup direction="horizontal" className="flex-1">
                {/* Main content */}
                <ResizablePanel defaultSize={75} minSize={50}>
                  <main className="h-full w-full overflow-auto">
                    {children}
                  </main>
                </ResizablePanel>
                
                {/* Resizable handle */}
                <ResizableHandle withHandle />
                
                {/* Right sidebar */}
                <ResizablePanel 
                  defaultSize={25} 
                  minSize={isRightSidebarCollapsed ? 3 : 15}
                  maxSize={40}
                >
                  <RightSidebar 
                    isCollapsed={isRightSidebarCollapsed}
                    onToggle={() => setIsRightSidebarCollapsed(!isRightSidebarCollapsed)}
                  />
                </ResizablePanel>
              </ResizablePanelGroup>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
};

export default AppLayout;
