
import React, { useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Drawer, DrawerTrigger, DrawerContent } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useClientDocuments } from '@/hooks/useClientDocuments';
import { useClientLookup } from '@/hooks/useClientLookup';
import { detectPageType, extractClientId } from './pageDetectionHelpers';
import ResizableHandle from './ResizableHandle';
import SidebarHeader from './SidebarHeader';
import AdminSidebarSection from './AdminSidebarSection';
import KnowledgeSidebarSection from './KnowledgeSidebarSection';
import StreamlinedClientSidebar from './StreamlinedClientSidebar';
import GeneralSidebarSection from './GeneralSidebarSection';
import LoadingErrorSection from './LoadingErrorSection';
import { ScrollArea } from '@/components/ui/scroll-area';

import { useRightSidebar } from './RightSidebarContext';

const ResizableRightSidebar = () => {
  const {
    isCollapsed,
    setIsCollapsed,
    isHidden,
    setIsHidden,
    width,
    setWidth
  } = useRightSidebar();
  const isMobile = useIsMobile();
  const [isDragging, setIsDragging] = useState(false);
  const handleClose = useCallback(() => {
    setIsHidden(true);
    setIsCollapsed(false);
  }, [setIsHidden, setIsCollapsed]);
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

  if (isMobile) {
    return (
      <Drawer open={!isHidden} onOpenChange={(open) => setIsHidden(!open)}>
        <DrawerTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed bottom-4 right-4 z-50"
          >
            <MessageSquare className="h-5 w-5" />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="p-0">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="h-[90vh] flex flex-col"
          >
            <SidebarHeader
              title={getPageTitle()}
              onClose={handleClose}
            />
            {!isCollapsed && (
              <ScrollArea className="flex-1">
                <div className="p-4">{renderContent()}</div>
              </ScrollArea>
            )}
          </motion.div>
        </DrawerContent>
      </Drawer>
    );
  }

  if (isHidden) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="border-l"
        onClick={() => setIsHidden(false)}
      >
        <MessageSquare className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <div className="relative flex h-full">
      <ResizableHandle onMouseDown={handleMouseDown} />

      <motion.div
        className="border-l bg-background flex flex-col h-full"
        style={{ width: `${width}px`, minWidth: '280px', maxWidth: '600px' }}
        animate={{ width }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <SidebarHeader
          title={getPageTitle()}
          onClose={handleClose}
        />

        {!isCollapsed && (
          <ScrollArea className="flex-1">
            <div className="p-4">
              {renderContent()}
            </div>
          </ScrollArea>
        )}
      </motion.div>
    </div>
  );
};

export default ResizableRightSidebar;
