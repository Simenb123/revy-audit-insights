
import React, { ReactNode } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppHeader from './AppHeader';
import Sidebar from './Sidebar';
import RevyAssistant from '../Revy/RevyAssistant';
import { TooltipProvider } from '@/components/ui/tooltip';

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <Sidebar />
          <SidebarInset>
            <div className="flex flex-col h-screen w-full">
              {/* Fixed header */}
              <AppHeader />
              
              {/* Main content with proper overflow handling */}
              <main className="flex-1 w-full overflow-auto">
                {children}
              </main>
              
              <RevyAssistant />
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
};

export default AppLayout;
