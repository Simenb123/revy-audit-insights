
import React, { ReactNode, useState } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
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
      <div className="min-h-screen w-full bg-background">
        {/* Fixed header spanning full width at the top */}
        <AppHeader />
        
        {/* Main layout below header using SidebarProvider */}
        <SidebarProvider>
          <div className="flex w-full pt-14"> {/* pt-14 to account for fixed header height */}
            {/* Left Sidebar */}
            <Sidebar />
            
            {/* Main content area using SidebarInset - this will auto-adjust based on sidebar state */}
            <SidebarInset className="flex-1 min-h-[calc(100vh-3.5rem)]">
              <div className="flex w-full h-full">
                {/* Main content - takes remaining space after right sidebar */}
                <main className={`flex-1 overflow-auto p-3 transition-all duration-300 ${
                  isRightSidebarCollapsed ? 'mr-0' : 'mr-64'
                }`}>
                  {children}
                  
                  {/* Show expand button when right sidebar is collapsed */}
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
                
                {/* Right sidebar - fixed positioning with reduced width */}
                <div className={`fixed top-14 right-0 h-[calc(100vh-3.5rem)] w-64 transition-transform duration-300 z-20 ${
                  isRightSidebarCollapsed ? 'translate-x-full' : 'translate-x-0'
                }`}>
                  <RightSidebar 
                    isCollapsed={isRightSidebarCollapsed}
                    onToggle={() => setIsRightSidebarCollapsed(!isRightSidebarCollapsed)}
                  />
                </div>
              </div>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </div>
    </TooltipProvider>
  );
};

export default AppLayout;
