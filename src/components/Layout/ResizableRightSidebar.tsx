
import React, { useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Drawer, DrawerTrigger, DrawerContent } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { MessageSquare, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useClientLookup } from '@/hooks/useClientLookup';
import { detectPageType, extractClientId } from './pageDetectionHelpers';
import AiRevyCard, { AiRevyVariant } from '@/components/AiRevyCard';
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
  const location = useLocation();
  const pageType = detectPageType(location.pathname);
  const clientIdOrOrg = extractClientId(location.pathname);
  const { data: clientLookup } = useClientLookup(clientIdOrOrg);
  const clientId = clientLookup?.id;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      const newWidth = Math.max(320, Math.min(600, window.innerWidth - e.clientX));
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

  const toggleSidebar = () => {
    if (isHidden) {
      setIsHidden(false);
      setIsCollapsed(false);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  const closeSidebar = () => {
    setIsHidden(true);
    setIsCollapsed(false);
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
    return (
      <AiRevyCard
        variant={pageType as AiRevyVariant}
        className="h-full w-full flex flex-col border-0"
        context={clientId ? 'client-detail' : 'general'}
        clientData={clientId ? { id: clientId } : undefined}
      />
    );
  };

  // Mobile version
  if (isMobile) {
    return (
      <Drawer open={!isHidden} onOpenChange={(open) => setIsHidden(!open)}>
        <DrawerTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <MessageSquare className="h-5 w-5" />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="h-[85vh] p-0">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">{getPageTitle()}</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeSidebar}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <ScrollArea className="flex-1">
              {renderContent()}
            </ScrollArea>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop version - hidden state
  if (isHidden) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="fixed top-20 right-4 z-50 h-10 w-10 shadow-lg bg-background border"
        onClick={() => setIsHidden(false)}
      >
        <MessageSquare className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <motion.div
      className="sticky top-[var(--header-height)] bg-background border-l flex flex-col z-10"
      style={{
        width: isCollapsed ? 32 : width,
        minWidth: isCollapsed ? 32 : 320,
        maxWidth: isCollapsed ? 32 : 600,
        height: 'calc(100vh - var(--header-height))'
      }}
      animate={{ width: isCollapsed ? 32 : width }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Resize handle */}
      {!isCollapsed && (
        <div
          className="absolute left-0 top-0 w-1 h-full bg-border hover:bg-primary/20 cursor-col-resize transition-colors z-20"
          onMouseDown={handleMouseDown}
        />
      )}

      {/* Collapsed state - narrow sidebar with expand button */}
      {isCollapsed && (
        <div className="relative w-full h-full bg-background border-t-2 border-t-border/50">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 left-1/2 transform -translate-x-1/2 h-6 w-6"
            onClick={toggleSidebar}
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Expanded content */}
      {!isCollapsed && (
        <>
          {/* Header with top border line */}
          <div className="flex items-center justify-between p-3 border-b bg-muted/30 border-t-2 border-t-border/50 flex-shrink-0">
            <h3 className="text-sm font-medium truncate">{getPageTitle()}</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={toggleSidebar}
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>

          {/* Content - flexible height container */}
          <div className="flex-1 min-h-0">
            {renderContent()}
          </div>
        </>
      )}
    </motion.div>
  );
};

export default ResizableRightSidebar;
