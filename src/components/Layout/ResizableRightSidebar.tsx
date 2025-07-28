
import React, { useState, useCallback, useEffect } from 'react';
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
import ResizableHandle from './ResizableHandle';

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
      <Drawer open={!isHidden} onOpenChange={(open) => setIsHidden(!open)}>
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
        height: 'calc(100vh - var(--header-height))'
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

      {/* Collapsed state - 32px width with expand button */}
      {isCollapsed && (
        <div className="relative h-full bg-background border-t-2 border-t-border/50 flex flex-col items-center py-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 bg-background border shadow-sm hover:bg-muted transition-colors"
            onClick={toggleSidebar}
            title="Utvid sidebar (Ctrl+Shift+R)"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Expanded content */}
      {!isCollapsed && (
        <>
          {/* Header with top border line */}
          <div className="flex items-center justify-between p-3 border-b bg-muted/30 border-t-2 border-t-border/50">
            <h3 className="text-sm font-medium truncate">{getPageTitle()}</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:bg-muted transition-colors"
              onClick={toggleSidebar}
              title="Kollaps sidebar (Ctrl+Shift+R)"
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1">
            {renderContent()}
          </ScrollArea>
        </>
      )}
    </motion.div>
  );
};

export default ResizableRightSidebar;
