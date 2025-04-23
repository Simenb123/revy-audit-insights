
import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import AppHeader from './Header';

interface MainLayoutProps {
  children: ReactNode;
  className?: string;
}

export default function MainLayout({ children, className = '' }: MainLayoutProps) {
  return (
    <div className={`flex h-screen overflow-hidden ${className}`}>
      {/* Header */}
      <AppHeader />
      
      {/* Main content area */}
      <div className="flex w-full pt-16">
        {/* Sidebar */}
        <aside className="sticky top-16 h-[calc(100vh-64px)] w-64 shrink-0 border-r bg-white">
          <Sidebar />
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-6">{children}</main>
      </div>
    </div>
  );
}
