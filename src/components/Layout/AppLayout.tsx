
import React, { ReactNode } from 'react';
import AppHeader from './AppHeader';
import Sidebar from './Sidebar';
import RevyAssistant from '../Revy/RevyAssistant';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SidebarProvider } from '@/components/ui/sidebar';

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider>
        <div className="flex flex-col min-h-screen w-full overflow-hidden bg-background">
          <AppHeader />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-auto relative">
              <div className="container mx-auto px-4 py-8 max-w-7xl min-w-0">
                {children}
              </div>
            </main>
            <RevyAssistant />
          </div>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
};

export default AppLayout;
