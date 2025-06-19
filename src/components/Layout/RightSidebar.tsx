
import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  MessageSquare, 
  X,
  PanelRightClose
} from 'lucide-react';
import { useIsMobile } from "@/hooks/use-mobile";

interface RightSidebarProps {
  onToggle: () => void;
}

const RightSidebar = ({ onToggle }: RightSidebarProps) => {
  const isMobile = useIsMobile();

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
      
      {/* Simple AI Chat Content */}
      <div className="flex-1 min-h-0 p-4">
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto mb-4">
            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-900">
                  Hei! Jeg er AI-Revi assistenten. Hvordan kan jeg hjelpe deg i dag?
                </p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-border pt-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Skriv din melding..."
                className="flex-1 px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <Button size="sm" className="px-3">
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;
