
import React, { useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useClientDocuments } from '@/hooks/useClientDocuments';
import { useClientLookup } from '@/hooks/useClientLookup';
import { detectPageType, extractClientId } from './pageDetectionHelpers';
import ResizableHandle from './ResizableHandle';
import SidebarHeader from './SidebarHeader';
import AdminSidebarSection from './AdminSidebarSection';
import KnowledgeSidebarSection from './KnowledgeSidebarSection';
import ClientSidebarSection from './ClientSidebarSection';
import GeneralSidebarSection from './GeneralSidebarSection';
import LoadingErrorSection from './LoadingErrorSection';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ResizableRightSidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
  initialWidth?: number;
  onWidthChange?: (width: number) => void;
}

const ResizableRightSidebar = ({ 
  isCollapsed, 
  onToggle, 
  initialWidth = 320,
  onWidthChange 
}: ResizableRightSidebarProps) => {
  const [width, setWidth] = useState(initialWidth);
  const [isDragging, setIsDragging] = useState(false);
  const location = useLocation();
  const pageType = detectPageType(location.pathname);
  const clientIdOrOrg = extractClientId(location.pathname);
  const { data: clientLookup } = useClientLookup(clientIdOrOrg);
  const clientId = clientLookup?.id;

  const {
    documentsCount,
    categoriesCount,
    isLoading,
    error
  } = useClientDocuments(clientId);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const newWidth = Math.max(280, Math.min(600, window.innerWidth - e.clientX));
    setWidth(newWidth);
    onWidthChange?.(newWidth);
  }, [isDragging, onWidthChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const getPageTitle = () => {
    switch (pageType) {
      case 'admin':
        return 'Admin';
      case 'knowledge':
        return 'Kunnskapsbase';
      default:
        return clientId ? 'Klient' : 'Assistent';
    }
  };

  const sidebarStyle = {
    width: `${width}px`,
    minWidth: '280px',
    maxWidth: '600px'
  };

  const renderContent = () => {
    if (pageType === 'admin') {
      return <AdminSidebarSection />;
    }

    if (pageType === 'knowledge') {
      return <KnowledgeSidebarSection />;
    }

    if (isLoading || error) {
      return <LoadingErrorSection isLoading={isLoading} error={error} />;
    }

    if (clientId) {
      return (
        <ClientSidebarSection
          clientId={clientId}
          documentsCount={documentsCount}
          categoriesCount={categoriesCount}
        />
      );
    }

    return <GeneralSidebarSection />;
  };

  return (
    <div className="relative flex">
      <ResizableHandle onMouseDown={handleMouseDown} />
      
      <div className="border-l bg-background flex flex-col h-full" style={sidebarStyle}>
        <SidebarHeader 
          title={getPageTitle()}
          isCollapsed={isCollapsed}
          onToggle={onToggle}
        />
        
        {!isCollapsed && (
          <ScrollArea className="flex-1">
            <div className="p-4">
              {renderContent()}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
};

export default ResizableRightSidebar;
