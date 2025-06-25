
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
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';

import { useRightSidebar } from './RightSidebarContext';

const ResizableRightSidebar = () => {
  const { isCollapsed, setIsCollapsed, width, setWidth } = useRightSidebar();
  const [isDragging, setIsDragging] = useState(false);
  const toggleCollapsed = useCallback(() => setIsCollapsed(v => !v), [setIsCollapsed]);
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

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const newWidth = Math.max(280, Math.min(600, window.innerWidth - e.clientX));
      setWidth(newWidth);
    },
    [isDragging, setWidth]
  );

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
    <div className="relative flex h-full">
      <ResizableHandle onMouseDown={handleMouseDown} />

      <motion.div
        className="border-l bg-background flex flex-col h-full overflow-hidden"
        animate={{ width: isCollapsed ? 0 : width }}
        style={{
          minWidth: isCollapsed ? 0 : 280,
          maxWidth: 600
        }}
        transition={{ type: 'spring', stiffness: 250, damping: 30 }}
      >
        {!isCollapsed && (
          <>
            <SidebarHeader
              title={getPageTitle()}
              onToggle={toggleCollapsed}
            />
            <ScrollArea className="flex-1">
              <div className="p-4">
                {renderContent()}
              </div>
            </ScrollArea>
          </>
        )}
      </motion.div>

      {isCollapsed && (
        <div className="w-[var(--sidebar-width-icon)] border-l bg-background flex flex-col items-center py-4">
          <Button variant="ghost" size="icon" onClick={toggleCollapsed}>
            <MessageSquare className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ResizableRightSidebar;
