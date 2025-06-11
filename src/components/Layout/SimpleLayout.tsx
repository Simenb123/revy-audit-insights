
import React from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import Sidebar from './Sidebar';
import AppHeader from './AppHeader';

interface SimpleLayoutProps {
  children: React.ReactNode;
}

const SimpleLayout = ({ children }: SimpleLayoutProps) => {
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
      </div>
    </SidebarProvider>
  );
};

export default SimpleLayout;
