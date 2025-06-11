
import React from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import Sidebar from './Sidebar';
import AppHeader from './AppHeader';

interface AppLayoutProps {
  children: React.ReactNode;
}

import EnhancedRevyAssistant from '@/components/Revy/EnhancedRevyAssistant';

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-sidebar">
        <Sidebar />
        <SidebarInset className="flex-1">
          <AppHeader />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto">
              {children}
            </div>
          </main>
        </SidebarInset>
        <EnhancedRevyAssistant />
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
