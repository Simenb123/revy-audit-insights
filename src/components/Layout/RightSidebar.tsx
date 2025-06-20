
import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  MessageSquare, 
  X,
  PanelRightClose,
  PanelRightOpen
} from 'lucide-react';
import { useIsMobile } from "@/hooks/use-mobile";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import SmartReviAssistant from '@/components/Revy/SmartRevyAssistant';
import { useLocation, useParams } from 'react-router-dom';
import { useClientDetails } from '@/hooks/useClientDetails';
import { RevyContext } from '@/types/revio';

interface RightSidebarProps {
  isCollapsed?: boolean;
  onToggle: () => void;
}

const RightSidebar = ({ isCollapsed = false, onToggle }: RightSidebarProps) => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const { orgNumber } = useParams<{ orgNumber: string }>();
  const { data: clientData } = useClientDetails(orgNumber || '');

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

  if (isCollapsed) {
    return (
      <div className="h-full flex flex-col w-full overflow-hidden bg-background">
        {/* Collapsed Content - Only the chat icon */}
        <div className="flex-1 min-h-0 p-2 flex justify-center items-center">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggle}
                  className="h-8 w-8 hover:bg-accent"
                >
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                AI-Revi Assistant
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col w-full overflow-hidden bg-background">
      {/* Expanded Header */}
      <div className="border-b border-border flex items-center justify-between p-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-base">AI-Revi Assistant</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-8 w-8 hover:bg-accent"
          title={isMobile ? "Lukk" : "Trekk inn AI-assistant"}
        >
          {isMobile ? <X className="h-4 w-4" /> : <PanelRightClose className="h-4 w-4" />}
        </Button>
      </div>
      
      {/* SmartReviAssistant Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <SmartReviAssistant
          embedded={true}
          clientData={clientData}
          userRole="revisor"
          context={currentContext}
        />
      </div>
    </div>
  );
};

export default RightSidebar;
