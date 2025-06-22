
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { 
  MessageSquare, 
  X,
  PanelRightClose,
  PanelRightOpen,
  Settings,
  Maximize2,
  Minimize2,
  GripVertical
} from 'lucide-react';
import { useIsMobile } from "@/hooks/use-mobile";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import SmartReviAssistant from '@/components/Revy/SmartRevyAssistant';
import { useLocation, useParams } from 'react-router-dom';
import { useClientDetails } from '@/hooks/useClientDetails';
import { useClientDocuments } from '@/hooks/useClientDocuments';
import { RevyContext } from '@/types/revio';
import { cn } from '@/lib/utils';

interface RightSidebarProps {
  isCollapsed?: boolean;
  onToggle: () => void;
  width: number;
  onWidthChange: (width: number) => void;
}

type SidebarSize = 'compact' | 'normal' | 'wide';

const RightSidebar = ({ isCollapsed = false, onToggle, width, onWidthChange }: RightSidebarProps) => {
  const [sidebarSize, setSidebarSize] = useState<SidebarSize>('normal');
  const [isPeekMode, setIsPeekMode] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const location = useLocation();
  const { orgNumber } = useParams<{ orgNumber: string }>();
  const { data: clientData } = useClientDetails(orgNumber || '');
  const { documents } = useClientDocuments(clientData?.id || '');

  // Determine context based on current route
  const getContextFromRoute = (): RevyContext => {
    if (location.pathname.includes('/klienter/') && orgNumber) {
      return 'client-detail';
    }
    if (location.pathname.includes('/dokumenter')) {
      return 'documentation';
    }
    if (location.pathname.includes('/handlinger')) {
      return 'audit-actions';
    }
    return 'general';
  };

  const currentContext = getContextFromRoute();

  // Enhanced client data with documents for AI context
  const enhancedClientData = clientData ? {
    ...clientData,
    documents: documents || [],
    documentSummary: {
      totalDocuments: (documents || []).length,
      categories: [...new Set((documents || []).map(d => d.category).filter(Boolean))],
      subjectAreas: [...new Set((documents || []).map(d => d.subject_area).filter(Boolean))],
      recentDocuments: (documents || []).slice(0, 5).map(d => ({
        name: d.file_name,
        category: d.category,
        uploadDate: d.created_at
      }))
    }
  } : null;

  // Resize functionality
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isCollapsed) return;
    
    e.preventDefault();
    setIsResizing(true);
    
    const startX = e.clientX;
    const startWidth = width;
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = startX - e.clientX; // Reverse delta since we're resizing from the right
      const newWidth = Math.max(280, Math.min(window.innerWidth - 320, startWidth + deltaX)); // Min 280px, max leaves 320px for left sidebar
      onWidthChange(newWidth);
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [isCollapsed, width, onWidthChange]);

  const handleSizeChange = useCallback((size: SidebarSize) => {
    setSidebarSize(size);
    setIsPeekMode(false);
    setIsSettingsOpen(false);
    
    // Adjust width based on size preset
    const sizeWidths = {
      compact: 280,
      normal: 400,
      wide: 600
    };
    onWidthChange(sizeWidths[size]);
  }, [onWidthChange]);

  const togglePeekMode = useCallback(() => {
    setIsPeekMode(!isPeekMode);
    setIsSettingsOpen(false);
  }, [isPeekMode]);

  const toggleSettings = useCallback(() => {
    setIsSettingsOpen(!isSettingsOpen);
  }, [isSettingsOpen]);

  // Auto-collapse on mobile
  useEffect(() => {
    if (isMobile && !isCollapsed) {
      onToggle();
    }
  }, [isMobile, isCollapsed, onToggle]);

  if (isCollapsed) {
    return (
      <div className="h-full w-full bg-background border-l border-border flex flex-col relative">
        {/* Toggle button positioned on the left side inside the sidebar */}
        <div className="absolute top-4 left-2 z-20">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggle}
                  className="h-8 w-8 hover:bg-accent"
                >
                  <PanelRightOpen className="h-4 w-4 text-blue-600" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                Åpne AI-Revi Assistant
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Quick indicators when collapsed */}
        <div className="flex-1 min-h-0 p-2 flex flex-col items-center gap-2 pt-14">
          {enhancedClientData && (
            <div className="flex flex-col items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-green-500" title="Klient aktiv" />
              {enhancedClientData.documentSummary.totalDocuments > 0 && (
                <div className="text-xs text-muted-foreground">
                  {enhancedClientData.documentSummary.totalDocuments}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "h-full w-full bg-background border-l border-border flex flex-col overflow-hidden relative",
      isPeekMode && "shadow-lg z-10"
    )}>
      {/* Resize handle - only visible when not collapsed */}
      {!isCollapsed && !isMobile && (
        <div
          ref={resizeHandleRef}
          className={cn(
            "absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500/20 transition-colors z-30 group",
            isResizing && "bg-blue-500/30"
          )}
          onMouseDown={handleMouseDown}
        >
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      )}

      {/* Toggle button positioned on the left side inside the sidebar */}
      <div className="absolute top-4 left-2 z-20">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-8 w-8 hover:bg-accent flex-shrink-0"
          title={isMobile ? "Lukk" : "Trekk inn AI-assistant"}
        >
          {isMobile ? <X className="h-4 w-4" /> : <PanelRightClose className="h-4 w-4" />}
        </Button>
      </div>

      {/* Enhanced Header */}
      <div className="border-b border-border flex items-center justify-between p-3 pl-12 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <MessageSquare className="h-4 w-4 text-blue-600 flex-shrink-0" />
          <h3 className="font-medium text-sm truncate">AI-Revi Assistant</h3>
          {enhancedClientData && (
            <div className="h-2 w-2 rounded-full bg-green-500 flex-shrink-0" title="Aktiv klient" />
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {/* Size controls - only on desktop */}
          {!isMobile && (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={togglePeekMode}
                    className="h-6 w-6 hover:bg-accent"
                  >
                    {isPeekMode ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  {isPeekMode ? 'Normal modus' : 'Peek modus'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Settings dropdown for size */}
          {!isMobile && (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 hover:bg-accent"
                      onClick={toggleSettings}
                    >
                      <Settings className="h-3 w-3" />
                    </Button>
                    {isSettingsOpen && (
                      <div className="absolute right-0 top-full mt-1 bg-popover border rounded-md shadow-lg z-50 min-w-[140px]">
                        <div className="p-2 space-y-1">
                          <button
                            onClick={() => handleSizeChange('compact')}
                            className={cn(
                              "w-full text-left px-3 py-2 text-xs rounded hover:bg-accent transition-colors",
                              sidebarSize === 'compact' && "bg-accent"
                            )}
                          >
                            Kompakt (280px)
                          </button>
                          <button
                            onClick={() => handleSizeChange('normal')}
                            className={cn(
                              "w-full text-left px-3 py-2 text-xs rounded hover:bg-accent transition-colors",
                              sidebarSize === 'normal' && "bg-accent"
                            )}
                          >
                            Normal (400px)
                          </button>
                          <button
                            onClick={() => handleSizeChange('wide')}
                            className={cn(
                              "w-full text-left px-3 py-2 text-xs rounded hover:bg-accent transition-colors",
                              sidebarSize === 'wide' && "bg-accent"
                            )}
                          >
                            Bred (600px)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left">
                  Tilpass bredde
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      {/* Context indicator */}
      {enhancedClientData && (
        <div className="px-3 py-2 bg-muted/30 border-b text-xs text-muted-foreground flex items-center justify-between">
          <span className="truncate">
            {enhancedClientData.company_name || enhancedClientData.name}
          </span>
          <span className="flex-shrink-0 ml-2">
            {enhancedClientData.documentSummary.totalDocuments} dok
          </span>
        </div>
      )}
      
      {/* SmartReviAssistant Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <SmartReviAssistant
          embedded={true}
          clientData={enhancedClientData}
          userRole="revisor"
          context={currentContext}
        />
      </div>

      {/* Click outside to close settings */}
      {isSettingsOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
};

export default RightSidebar;
