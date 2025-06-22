
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
      
      <div className="flex flex-1 relative">
        {/* Left Sidebar - Fixed position */}
        <div 
          className={`fixed left-0 top-16 bottom-0 z-40 transition-all duration-300 ${
            leftSidebarCollapsed ? 'w-16' : 'w-64'
          }`}
          style={{ height: 'calc(100vh - 4rem)' }}
        >
          <Sidebar 
            isCollapsed={leftSidebarCollapsed}
            onToggle={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
          />
        </div>
        
        {/* Main Content Area - Adjusted for fixed sidebars */}
        <main 
          className="flex-1 overflow-auto bg-white transition-all duration-300"
          style={{ 
            marginLeft: leftSidebarCollapsed ? '4rem' : '16rem',
            marginRight: rightSidebarCollapsed ? '4rem' : '20rem',
            height: 'calc(100vh - 4rem)'
          }}
        >
          <div className="container mx-auto px-4 py-6 max-w-none">
            <Outlet />
          </div>
        </main>
        
        {/* Right Sidebar - Fixed position */}
        <div 
          className={`fixed right-0 top-16 bottom-0 z-40 transition-all duration-300 ${
            rightSidebarCollapsed ? 'w-16' : 'w-80'
          }`}
          style={{ height: 'calc(100vh - 4rem)' }}
        >
          <RightSidebar 
            isCollapsed={rightSidebarCollapsed}
            onToggle={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
          />
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
