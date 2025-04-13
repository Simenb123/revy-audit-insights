
import React, { ReactNode } from 'react';
import AppHeader from './AppHeader';
import Sidebar from './Sidebar';
import RevyAssistant from '../Revy/RevyAssistant';

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="flex flex-col h-screen">
      <AppHeader />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6 bg-gray-50">
          {children}
        </main>
        <RevyAssistant />
      </div>
    </div>
  );
};

export default AppLayout;
