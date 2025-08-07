
import React, { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Drawer, DrawerTrigger, DrawerContent } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useClientLookup } from '@/hooks/useClientLookup';
import { detectPageType, extractClientId } from './pageDetectionHelpers';
import AiRevyCard, { AiRevyVariant } from '@/components/AiRevyCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import ResizableHandle from './ResizableHandle';

import { useRightSidebar } from './RightSidebarContext';

const ResizableRightSidebar = () => {
  const { isCollapsed, setIsCollapsed, width, setWidth } = useRightSidebar();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const isMobile = useIsMobile();
  const [isDragging, setIsDragging] = useState(false);
  const location = useLocation();
  const pageType = detectPageType(location.pathname);
  const clientIdOrOrg = extractClientId(location.pathname);
  const { data: clientLookup } = useClientLookup(clientIdOrOrg);
  const clientId = clientLookup?.id;

  const startWidthRef = React.useRef(width);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      startWidthRef.current = width;
      setIsDragging(true);
    },
    [width]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      const rawWidth = window.innerWidth - e.clientX;
      const clampedWidth = Math.max(320, Math.min(600, rawWidth));
      setWidth(clampedWidth);
    },
    [isDragging, setWidth]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        toggleSidebar();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const getPageTitle = () => {
    switch (pageType) {
      case 'admin':
        return 'Admin Assistent';
      case 'knowledge':
        return 'Kunnskapsbase';
      default:
        return clientId ? 'Klient Assistent' : 'AI Assistent';
    }
  };

  const renderContent = () => {
    const variant: AiRevyVariant = clientId
      ? 'client'
      : pageType === 'admin'
        ? 'admin'
        : pageType === 'knowledge'
          ? 'knowledge'
          : 'general';

    return (
      <AiRevyCard
        variant={variant}
        className="h-full w-full flex flex-col border-0"
        context={clientId ? 'client-detail' : 'general'}
        clientData={clientId ? { id: clientId } : undefined}
      />
    );
  };

  // Mobile version
  if (isMobile) {
    return (
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerTrigger asChild>
          <Button
            variant="default"
            size="icon"
            className="fixed bottom-4 right-4 z-50 h-12 w-12 max-h-12 max-w-12 rounded-full shadow-lg"
            style={{ maxWidth: '48px', maxHeight: '48px' }}
          >
            <MessageSquare className="h-5 w-5" />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="h-[85vh] p-0">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">{getPageTitle()}</h3>
            </div>
            <ScrollArea className="flex-1">
              {renderContent()}
            </ScrollArea>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <motion.div
      className="sticky top-[calc(var(--global-header-height)+var(--client-sub-header-height))] bg-background border-l flex flex-col z-10"
      style={{
        height: 'calc(100vh - var(--global-header-height) - var(--client-sub-header-height))'
      }}
      animate={{ width: isCollapsed ? 32 : width }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
    >
      {/* Enhanced Resize handle */}
      {!isCollapsed && (
        <div className="absolute left-0 top-0 z-20">
          <ResizableHandle onMouseDown={handleMouseDown} />
        </div>
      )}

      {/* Sticky Header */}
      <div className="sticky top-[calc(var(--global-header-height)+var(--sub-header-height))] z-50 bg-background border-b flex items-center justify-between px-3 py-2">
        {isCollapsed ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-muted transition-colors"
            onClick={toggleSidebar}
            aria-label="Utvid sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <>
            <h3 className="text-sm font-semibold">{getPageTitle()}</h3>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 hover:bg-muted transition-colors"
                onClick={toggleSidebar}
                aria-label="Kollaps sidebar"
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Content area */}
      {!isCollapsed && (
        <div className="flex-1 flex flex-col min-h-0">
          {renderContent()}
        </div>
      )}
    </motion.div>
  );
};

export default ResizableRightSidebar;
