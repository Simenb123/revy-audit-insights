
import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import AppHeader from './AppHeader';
import Sidebar from './Sidebar';
import RightSidebar from './RightSidebar';
import { isDevelopment, isSecureContext } from '@/utils/networkHelpers';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

const AppLayout = () => {
  const [showSecurityWarning, setShowSecurityWarning] = useState(false);
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);

  useEffect(() => {
    // Check for development environment issues
    if (isDevelopment() && !isSecureContext()) {
      setShowSecurityWarning(true);
      console.warn('Development environment: Some features may require HTTPS to work properly');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col w-full">
      {showSecurityWarning && (
        <Alert className="border-orange-200 bg-orange-50 text-orange-800 rounded-none relative z-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Development-modus: Noen funksjoner kan kreve HTTPS. 
            <button 
              onClick={() => setShowSecurityWarning(false)}
              className="ml-2 underline hover:no-underline"
            >
              Skjul varsel
            </button>
          </AlertDescription>
        </Alert>
      )}
      
      <AppHeader />
      
      <div className="flex-1" style={{ height: 'calc(100vh - 4rem)' }}>
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Left Sidebar Panel */}
          <ResizablePanel 
            defaultSize={leftSidebarCollapsed ? 4 : 16} 
            minSize={4} 
            maxSize={25}
            className="min-w-16"
          >
            <Sidebar 
              isCollapsed={leftSidebarCollapsed}
              onToggle={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
            />
          </ResizablePanel>
          
          {!leftSidebarCollapsed && (
            <ResizableHandle withHandle className="w-2 bg-border hover:bg-accent transition-colors" />
          )}
          
          {/* Main Content Panel */}
          <ResizablePanel defaultSize={60} minSize={30}>
            <main className="h-full overflow-auto bg-white">
              <div className="container mx-auto px-4 py-6 max-w-none">
                <Outlet />
              </div>
            </main>
          </ResizablePanel>
          
          {!rightSidebarCollapsed && (
            <ResizableHandle withHandle className="w-2 bg-border hover:bg-accent transition-colors" />
          )}
          
          {/* Right Sidebar Panel */}
          <ResizablePanel 
            defaultSize={rightSidebarCollapsed ? 4 : 24} 
            minSize={4} 
            maxSize={50}
            className="min-w-16"
          >
            <RightSidebar 
              isCollapsed={rightSidebarCollapsed}
              onToggle={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default AppLayout;
