
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
        <Alert className="border-orange-200 bg-orange-50 text-orange-800 rounded-none">
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
      
      <div className="flex flex-1 w-full min-h-0">
        {/* Left Sidebar */}
        <div className={`flex-shrink-0 transition-all duration-300 ${
          leftSidebarCollapsed ? 'w-16' : 'w-64'
        }`}>
          <Sidebar 
            isCollapsed={leftSidebarCollapsed}
            onToggle={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
          />
        </div>
        
        {/* Main Content Area */}
        <main className="flex-1 min-w-0 overflow-auto bg-white">
          <div className="container mx-auto px-4 py-6 max-w-none">
            <Outlet />
          </div>
        </main>
        
        {/* Right Sidebar */}
        <div className={`flex-shrink-0 transition-all duration-300 ${
          rightSidebarCollapsed ? 'w-16' : ''
        }`}>
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
