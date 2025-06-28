
import React, { useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useClientDocuments } from '@/hooks/useClientDocuments';
import { useClientLookup } from '@/hooks/useClientLookup';
import { detectPageType, extractClientId } from './pageDetectionHelpers';
import ResizableHandle from './ResizableHandle';
import CompactSidebarHeader from './CompactSidebarHeader';
import AdminSidebarSection from './AdminSidebarSection';
import KnowledgeSidebarSection from './KnowledgeSidebarSection';
import StreamlinedClientSidebar from './StreamlinedClientSidebar';
import GeneralSidebarSection from './GeneralSidebarSection';
import LoadingErrorSection from './LoadingErrorSection';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import RevyAvatar from '@/components/Revy/RevyAvatar';

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
      return <StreamlinedClientSidebar clientId={clientId} />;
    }

    return <GeneralSidebarSection />;
  };

  return (
    <div className="relative flex h-full">
      <ResizableHandle onMouseDown={handleMouseDown} />

      <motion.div
        className="border-l bg-background flex flex-col h-full"
        animate={{ width: isCollapsed ? 0 : width }}
        style={{
          minWidth: isCollapsed ? 0 : 280,
          maxWidth: 600
        }}
        transition={{ type: 'spring', stiffness: 250, damping: 30 }}
      >
        {!isCollapsed && (
          <>
            <CompactSidebarHeader
              title={getPageTitle()}
              onToggle={toggleCollapsed}
            />
            <ScrollArea className="flex-1 h-full">
              <div className="p-3 space-y-3">
                {renderContent()}
              </div>
            </ScrollArea>
          </>
        )}
      </motion.div>

      {isCollapsed && (
        <div className="w-[var(--sidebar-width-icon)] border-l bg-background flex flex-col items-center py-4">
          <Button variant="ghost" size="icon" onClick={toggleCollapsed} className="p-1">
            <RevyAvatar size="sm" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ResizableRightSidebar;
