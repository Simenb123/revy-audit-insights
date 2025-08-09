
import React, { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Drawer, DrawerTrigger, DrawerContent, DrawerClose } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { MessageSquare, X, ChevronLeft, ChevronRight, Bot, BarChart2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useClientLookup } from '@/hooks/useClientLookup';
import { detectPageType, extractClientId } from './pageDetectionHelpers';
import AiRevyCard, { AiRevyVariant } from '@/components/AiRevyCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import ResizableHandle from './ResizableHandle';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { useRightSidebar } from './RightSidebarContext';
import { useLayout } from './LayoutContext';
import ClientFiguresPanel from '@/components/Sidebar/ClientFiguresPanel';

const COLLAPSED_WIDTH = 44;

const ResizableRightSidebar = () => {
  const {
    isCollapsed,
    setIsCollapsed,
    width,
    setWidth
  } = useRightSidebar();
  const { globalHeaderHeight, subHeaderHeight } = useLayout();

  const isMobile = useIsMobile();
  const [isDragging, setIsDragging] = useState(false);
  const location = useLocation();
  const pageType = detectPageType(location.pathname);
  const clientIdOrOrg = extractClientId(location.pathname);
  const { data: clientLookup } = useClientLookup(clientIdOrOrg);
  const clientId = clientLookup?.id;

  const [activeTab, setActiveTab] = useState<'ai' | 'chat' | 'figures'>('ai');

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
    const key = e.key.toLowerCase();
    if (e.ctrlKey && e.shiftKey) {
      if (key === 'r') {
        e.preventDefault();
        toggleSidebar();
      } else if (key === 'a') {
        e.preventDefault();
        openTab('ai');
      } else if (key === 'c') {
        e.preventDefault();
        openTab('chat');
      } else if (key === 'f') {
        e.preventDefault();
        openTab('figures');
      }
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

  const openTab = (tab: 'ai' | 'chat' | 'figures') => {
    setActiveTab(tab);
    if (isCollapsed) setIsCollapsed(false);
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
      <div className="flex h-full flex-1 flex-col min-h-0 overflow-hidden">
        {activeTab === 'figures' ? (
          <ClientFiguresPanel clientId={clientId} />
        ) : (
          <AiRevyCard
            variant={variant}
            className="w-full border-0"
            context={clientId ? 'client-detail' : 'general'}
            clientData={clientId ? { id: clientId } : undefined}
            activeTab={activeTab === 'chat' ? 'chat' : 'ai'}
            onTabChange={(tab) => setActiveTab(tab)}
            hideTabs={!isMobile}
          />
        )}
      </div>
    );
  };

  // Mobile version
  if (isMobile) {
    return (
      <Drawer>
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
              <DrawerClose asChild>
                <Button
                  variant="ghost"
                  size="icon"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
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
      data-testid="right-sidebar"
      className="sticky bg-background border-l flex flex-col z-10 overflow-hidden"
      style={{
        top: globalHeaderHeight + subHeaderHeight,
        height: `calc(100dvh - ${globalHeaderHeight + subHeaderHeight}px)`
      }}
      animate={{ width: isCollapsed ? COLLAPSED_WIDTH : width }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
    >
      {/* Enhanced Resize handle */}
      {!isCollapsed && (
        <div className="absolute left-0 top-0 z-20">
          <ResizableHandle onMouseDown={handleMouseDown} />
        </div>
      )}
      
      {/* Visual border line in collapsed state */}
      {isCollapsed && (
        <div className="absolute left-0 top-0 h-full w-px bg-border pointer-events-none" />
      )}

      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-background border-b">
        <TooltipProvider>
          {isCollapsed ? (
            <div 
              className="flex flex-col items-center gap-3 px-0 py-3 h-full cursor-pointer"
              onDoubleClick={toggleSidebar}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative w-full">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`w-full h-10 justify-center hover-scale ${activeTab === 'ai' ? 'bg-primary/10 text-primary ring-1 ring-primary/30' : 'hover:bg-muted'}`}
                      onClick={() => openTab('ai')}
                      aria-label="Åpne AI-Revy Chat"
                    >
                      <Bot className="h-7 w-7" />
                    </Button>
                    {activeTab === 'ai' && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-0.5 rounded-full bg-primary" />
                    )}
                    
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left">AI‑Revy Chat</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative w-full">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`w-full h-10 justify-center hover-scale ${activeTab === 'chat' ? 'bg-primary/10 text-primary ring-1 ring-primary/30' : 'hover:bg-muted'}`}
                      onClick={() => openTab('chat')}
                      aria-label="Åpne Teamchat"
                    >
                      <MessageSquare className="h-7 w-7" />
                    </Button>
                    {activeTab === 'chat' && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-0.5 rounded-full bg-primary" />
                    )}
                    
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left">Teamchat</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative w-full">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`w-full h-10 justify-center hover-scale ${activeTab === 'figures' ? 'bg-primary/10 text-primary ring-1 ring-primary/30' : 'hover:bg-muted'}`}
                      onClick={() => openTab('figures')}
                      aria-label="Åpne Analyse"
                    >
                      <BarChart2 className="h-7 w-7" />
                    </Button>
                    {activeTab === 'figures' && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-0.5 rounded-full bg-primary" />
                    )}
                    
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left">Analyse</TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 hover:bg-muted transition-colors"
                onClick={toggleSidebar}
                aria-label="Kollaps sidebar"
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>

              <h3 className="text-sm font-semibold">{getPageTitle()}</h3>

              <div className="ml-auto flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 hover-scale ${activeTab === 'ai' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
                      onClick={() => setActiveTab('ai')}
                      aria-label="Bytt til AI-Revy Chat"
                    >
                      <Bot className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">AI‑Revy Chat</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 hover-scale ${activeTab === 'chat' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
                      onClick={() => setActiveTab('chat')}
                      aria-label="Bytt til Teamchat"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">Teamchat</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 hover-scale ${activeTab === 'figures' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
                      onClick={() => setActiveTab('figures')}
                      aria-label="Bytt til Analyse"
                    >
                      <BarChart2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">Analyse</TooltipContent>
                </Tooltip>
              </div>
            </div>
          )}
        </TooltipProvider>
      </div>

      {/* Content area */}
      {!isCollapsed && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {renderContent()}
        </div>
      )}
    </motion.div>
  );
};

export default ResizableRightSidebar;
