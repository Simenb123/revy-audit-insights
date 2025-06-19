
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  MessageSquare, 
  X,
  PanelRightClose
} from 'lucide-react';
import SmartRevyAssistant from '../Revy/SmartRevyAssistant';
import { useLocation, useParams } from 'react-router-dom';
import { useRevyContext } from '../RevyContext/RevyContextProvider';
import { useIsMobile } from "@/hooks/use-mobile";

interface RightSidebarProps {
  onToggle: () => void;
}

const RightSidebar = ({ onToggle }: RightSidebarProps) => {
  const location = useLocation();
  const { orgNumber } = useParams<{ orgNumber: string }>();
  const { currentClient } = useRevyContext();
  const isMobile = useIsMobile();

  // Simple context detection
  const getCurrentContext = () => {
    const path = location.pathname;
    if (path.includes('/klienter/') && orgNumber) {
      return 'client-detail';
    }
    return 'general';
  };

  const currentContext = getCurrentContext();

  return (
    <div className="h-full flex flex-col w-full overflow-hidden bg-background">
      {/* Simple Header */}
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
          title={isMobile ? "Lukk" : "Lukk AI-assistant"}
        >
          {isMobile ? <X className="h-4 w-4" /> : <PanelRightClose className="h-4 w-4" />}
        </Button>
      </div>
      
      {/* AI Assistant Content */}
      <div className="flex-1 min-h-0 p-4">
        <SmartRevyAssistant 
          embedded={true} 
          context={currentContext as any}
          clientData={currentClient}
          userRole="employee"
        />
      </div>
    </div>
  );
};

export default RightSidebar;
