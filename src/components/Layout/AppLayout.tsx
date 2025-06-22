
import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import AppHeader from './AppHeader';
import Sidebar from './Sidebar';
import RightSidebar from './RightSidebar';
import { isDevelopment, isSecureContext } from '@/utils/networkHelpers';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

const AppLayout = () => {
  const [showSecurityWarning, setShowSecurityWarning] = useState(false);
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);
  const [rightSidebarWidth, setRightSidebarWidth] = useState(320); // Default 320px

  useEffect(() => {
    // Check for development environment issues
    if (isDevelopment() && !isSecureContext()) {
      setShowSecurityWarning(true);
      console.warn('Development environment: Some features may require HTTPS to work properly');
    }
    
    // Load saved sidebar width from localStorage
    const savedWidth = localStorage.getItem('rightSidebarWidth');
    if (savedWidth) {
      setRightSidebarWidth(parseInt(savedWidth, 10));
    }
  }, []);

  const handleRightSidebarWidthChange = (newWidth: number) => {
    setRightSidebarWidth(newWidth);
    localStorage.setItem('rightSidebarWidth', newWidth.toString());
  };

  // Calculate main content margin based on sidebar states
  const leftSidebarWidth = leftSidebarCollapsed ? 64 : 256; // 4rem collapsed, 16rem expanded
  const rightSidebarWidthValue = rightSidebarCollapsed ? 64 : rightSidebarWidth;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col w-full relative">
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
      
      {/* Main layout container with fixed sidebars */}
      <div className="flex-1 relative" style={{ height: 'calc(100vh - 4rem)' }}>
        {/* Left Sidebar - Fixed positioned */}
        <div
          className="fixed left-0 top-16 bottom-0 z-10 transition-all duration-300 ease-in-out"
          style={{ width: `${leftSidebarWidth}px` }}
        >
          <Sidebar 
            isCollapsed={leftSidebarCollapsed}
            onToggle={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
          />
        </div>
        
        {/* Right Sidebar - Fixed positioned with custom width */}
        <div
          className="fixed right-0 top-16 bottom-0 z-10 transition-all duration-300 ease-in-out"
          style={{ width: `${rightSidebarWidthValue}px` }}
        >
          <RightSidebar 
            isCollapsed={rightSidebarCollapsed}
            onToggle={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
            width={rightSidebarWidth}
            onWidthChange={handleRightSidebarWidthChange}
          />
        </div>
        
        {/* Main Content - Adjusted margins based on sidebar states */}
        <main 
          className="h-full overflow-auto bg-white transition-all duration-300 ease-in-out"
          style={{
            marginLeft: `${leftSidebarWidth}px`,
            marginRight: `${rightSidebarWidthValue}px`
          }}
        >
          <div className="container mx-auto px-4 py-6 max-w-none">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
