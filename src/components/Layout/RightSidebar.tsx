
import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { 
  MessageSquare, 
  X,
  PanelRightClose,
  PanelRightOpen,
  Settings,
  Maximize2,
  Minimize2
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
}

type SidebarSize = 'compact' | 'normal' | 'wide';

const SIDEBAR_WIDTHS = {
  compact: 'w-64',    // 256px
  normal: 'w-80',     // 320px  
  wide: 'w-96',       // 384px
  collapsed: 'w-16'   // 64px
};

const RightSidebar = ({ isCollapsed = false, onToggle }: RightSidebarProps) => {
  const [sidebarSize, setSidebarSize] = useState<SidebarSize>('normal');
  const [isPeekMode, setIsPeekMode] = useState(false);
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

  const handleSizeChange = useCallback((size: SidebarSize) => {
    setSidebarSize(size);
    setIsPeekMode(false);
  }, []);

  const togglePeekMode = useCallback(() => {
    setIsPeekMode(!isPeekMode);
  }, [isPeekMode]);

  // Auto-collapse on mobile
  React.useEffect(() => {
    if (isMobile && !isCollapsed) {
      onToggle();
    }
  }, [isMobile, isCollapsed, onToggle]);

  if (isCollapsed) {
    return (
      <div className="h-full w-16 bg-background border-l border-border flex flex-col">
        <div className="flex-1 min-h-0 p-2 flex flex-col items-center gap-2 pt-4">
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

          {/* Quick indicators when collapsed */}
          {enhancedClientData && (
            <div className="flex flex-col items-center gap-1 mt-4">
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
      "h-full bg-background border-l border-border flex flex-col overflow-hidden transition-all duration-300",
      SIDEBAR_WIDTHS[sidebarSize],
      isPeekMode && "shadow-lg z-10"
    )}>
      {/* Enhanced Header */}
      <div className="border-b border-border flex items-center justify-between p-3 flex-shrink-0">
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
                      className="h-6 w-6 hover:bg-accent group"
                    >
                      <Settings className="h-3 w-3" />
                    </Button>
                    <div className="absolute right-0 top-full mt-1 bg-popover border rounded-md shadow-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="p-2 space-y-1 min-w-[120px]">
                        <button
                          onClick={() => handleSizeChange('compact')}
                          className={cn(
                            "w-full text-left px-2 py-1 text-xs rounded hover:bg-accent",
                            sidebarSize === 'compact' && "bg-accent"
                          )}
                        >
                          Kompakt (256px)
                        </button>
                        <button
                          onClick={() => handleSizeChange('normal')}
                          className={cn(
                            "w-full text-left px-2 py-1 text-xs rounded hover:bg-accent",
                            sidebarSize === 'normal' && "bg-accent"
                          )}
                        >
                          Normal (320px)
                        </button>
                        <button
                          onClick={() => handleSizeChange('wide')}
                          className={cn(
                            "w-full text-left px-2 py-1 text-xs rounded hover:bg-accent",
                            sidebarSize === 'wide' && "bg-accent"
                          )}
                        >
                          Bred (384px)
                        </button>
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left">
                  Tilpass bredde
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-6 w-6 hover:bg-accent flex-shrink-0"
            title={isMobile ? "Lukk" : "Trekk inn AI-assistant"}
          >
            {isMobile ? <X className="h-3 w-3" /> : <PanelRightClose className="h-3 w-3" />}
          </Button>
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
    </div>
  );
};

export default RightSidebar;
