
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
import { motion } from 'framer-motion';

import { useRightSidebar } from './RightSidebarContext';

const ResizableRightSidebar = () => {
  const { width, setWidth, isCollapsed } = useRightSidebar();
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

  const displayWidth = isCollapsed ? 64 : width;

  return (
    <div className="relative flex h-full">
      {!isCollapsed && <ResizableHandle onMouseDown={handleMouseDown} />}

      <motion.div
        className="border-l bg-background flex flex-col h-full"
        animate={{ width: displayWidth }}
        style={{
          minWidth: 280,
          maxWidth: 600
        }}
        transition={{ type: 'spring', stiffness: 250, damping: 30 }}
      >
        <CompactSidebarHeader title={getPageTitle()} />
        {!isCollapsed && (
          <ScrollArea className="flex-1 h-full">
            <div className="p-3 h-full">
              {renderContent()}
            </div>
          </ScrollArea>
        )}
      </motion.div>
    </div>
  );
};

export default ResizableRightSidebar;
