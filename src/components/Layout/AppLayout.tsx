
import React, { ReactNode } from 'react';
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
      <div className="flex h-screen w-full overflow-hidden bg-background">
        {/* Fixed header */}
        <AppHeader />
        
        {/* Main layout with sidebar and content */}
        <div className="flex w-full h-[calc(100vh-3.5rem)] overflow-hidden">
          <Sidebar />
          
          {/* Main content area that will properly expand and scroll */}
          <main className="flex-1 overflow-y-auto relative">
            <div className="h-full w-full">
              {children}
            </div>
          </main>
          
          {/* Revy assistant fixed at bottom right */}
          <RevyAssistant />
        </div>
      </div>
    </TooltipProvider>
  );
};

export default AppLayout;
