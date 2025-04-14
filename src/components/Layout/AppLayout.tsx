
import React, { ReactNode } from 'react';
import AppHeader from './AppHeader';
import Sidebar from './Sidebar';
import RevyAssistant from '../Revy/RevyAssistant';
import { SidebarProvider } from "@/components/ui/sidebar";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex flex-col h-screen">
        <AppHeader />
        <div className="flex flex-1 w-full overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-auto bg-gray-50">
            {children}
          </main>
          <RevyAssistant />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
