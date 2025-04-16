
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
      <div className="flex flex-col h-screen w-full bg-background">
        {/* Fixed header */}
        <AppHeader />
        
        {/* Flexible content area */}
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          
          {/* Main content with proper overflow handling */}
          <main className="flex-1 w-full overflow-auto">
            <div className="w-full h-full">
              {children}
            </div>
          </main>
          
          <RevyAssistant />
        </div>
      </div>
    </TooltipProvider>
  );
};

export default AppLayout;
