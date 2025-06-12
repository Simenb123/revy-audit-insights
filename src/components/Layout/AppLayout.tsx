
import React, { useState } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { ResizablePanelGroup, ResizablePanel } from '@/components/ui/resizable';
import Sidebar from './Sidebar';
import AppHeader from './AppHeader';
import RightSidebar from './RightSidebar';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
  const [isRightSidebarExpanded, setIsRightSidebarExpanded] = useState(false);

  const toggleRightSidebar = () => {
    if (isRightSidebarExpanded) {
      setIsRightSidebarExpanded(false);
    } else {
      setIsRightSidebarCollapsed(!isRightSidebarCollapsed);
    }
  };

  const toggleRightSidebarExpanded = () => {
    setIsRightSidebarExpanded(!isRightSidebarExpanded);
    if (!isRightSidebarExpanded) {
      setIsRightSidebarCollapsed(false);
    }
  };

  // Calculate right sidebar width based on state
  const getRightSidebarWidth = () => {
    if (isRightSidebarExpanded) return '85%';
    if (isRightSidebarCollapsed) return '60px';
    return '350px'; // Default width
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen w-full bg-background flex">
        {/* Left Sidebar */}
        <Sidebar />
        
        {/* Main Content with Header */}
        <SidebarInset className="flex-1 min-w-0">
          {/* Header - Fixed at top */}
          <header className="sticky top-0 z-50">
            <div className="flex h-16 shrink-0 items-center justify-between bg-gradient-to-r from-revio-500 to-revio-600 text-white px-4 shadow-lg">
              {/* Left Section with Sidebar Trigger */}
              <div className="flex items-center gap-4">
                <SidebarTrigger className="h-9 w-9 text-white hover:bg-white/20" />
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-bold">R</span>
                    </div>
                    <span className="font-bold text-xl">Revio</span>
                  </div>
                  <div className="h-6 w-px bg-white/30"></div>
                  <h1 className="text-lg font-semibold">RevisionAkademiet</h1>
                </div>
              </div>
              
              {/* Center Section - Search */}
              <div className="flex-1 max-w-lg mx-6">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                  <input 
                    type="text"
                    placeholder="Søk i opplæring og ressurser..."
                    className="w-full pl-10 pr-4 py-2 bg-white/20 border border-white/30 rounded-md text-white placeholder:text-white/60 focus:bg-white/30 focus:border-white/50 focus:outline-none"
                  />
                </div>
              </div>
              
              {/* Right Section */}
              <div className="flex items-center gap-2">
                <button className="h-9 w-9 text-white hover:bg-white/20 rounded-md flex items-center justify-center">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                
                <button className="h-9 w-9 text-white hover:bg-white/20 rounded-md flex items-center justify-center">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 7h5l-5-5v5z" />
                  </svg>
                </button>
                
                <button className="h-9 w-9 text-white hover:bg-white/20 rounded-md flex items-center justify-center">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                
                <button className="h-9 w-9 text-white hover:bg-white/20 rounded-md flex items-center justify-center">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>
              </div>
            </div>
          </header>

          {/* Main Content Area with Right Sidebar */}
          <div className="flex-1 relative">
            <ResizablePanelGroup direction="horizontal" className="h-[calc(100vh-64px)]">
              {/* Main Content Panel */}
              <ResizablePanel 
                defaultSize={100} 
                minSize={20}
                className="min-w-0"
                style={{ 
                  marginRight: isRightSidebarExpanded 
                    ? '85%' 
                    : isRightSidebarCollapsed 
                      ? '60px' 
                      : '350px' 
                }}
              >
                <main className="h-full overflow-auto bg-background p-6">
                  {children}
                </main>
              </ResizablePanel>
            </ResizablePanelGroup>

            {/* Right Sidebar - Fixed position */}
            <div 
              className="fixed right-0 top-16 h-[calc(100vh-64px)] bg-background border-l border-border z-30 transition-all duration-300"
              style={{ width: getRightSidebarWidth() }}
            >
              <RightSidebar 
                isCollapsed={isRightSidebarCollapsed}
                isExpanded={isRightSidebarExpanded}
                onToggle={toggleRightSidebar}
                onToggleExpanded={toggleRightSidebarExpanded}
              />
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
