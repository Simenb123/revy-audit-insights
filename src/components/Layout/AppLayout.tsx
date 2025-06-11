
import React, { ReactNode, useState } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import AppHeader from './AppHeader';
import Sidebar from './Sidebar';
import RightSidebar from './RightSidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          {/* Fixed header spanning full width at the top */}
          <AppHeader />
          
          {/* Main layout below header */}
          <div className="flex w-full pt-14"> {/* pt-14 to account for fixed header height */}
            {/* Left Sidebar */}
            <Sidebar />
            
            {/* Main content area */}
            <div className="flex-1">
              <ResizablePanelGroup direction="horizontal" className="h-[calc(100vh-3.5rem)]"> {/* Subtract header height */}
                {/* Main content */}
                <ResizablePanel defaultSize={isRightSidebarCollapsed ? 100 : 75} minSize={50}>
                  <main className="h-full w-full overflow-auto p-6">
                    {children}
                    
                    {/* Show expand button when sidebar is collapsed */}
                    {isRightSidebarCollapsed && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsRightSidebarCollapsed(false)}
                        className="fixed top-20 right-4 z-10 bg-white border border-border shadow-md hover:shadow-lg h-6 w-6"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                    )}
                  </main>
                </ResizablePanel>
                
                {/* Only show resizable handle and right sidebar when not collapsed */}
                {!isRightSidebarCollapsed && (
                  <>
                    {/* Resizable handle */}
                    <ResizableHandle withHandle />
                    
                    {/* Right sidebar */}
                    <ResizablePanel 
                      defaultSize={25} 
                      minSize={15}
                      maxSize={40}
                    >
                      <RightSidebar 
                        isCollapsed={isRightSidebarCollapsed}
                        onToggle={() => setIsRightSidebarCollapsed(!isRightSidebarCollapsed)}
                      />
                    </ResizablePanel>
                  </>
                )}
              </ResizablePanelGroup>
            </div>
          </div>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
};

export default AppLayout;
