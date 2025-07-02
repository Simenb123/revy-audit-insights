import React, { useState } from 'react';
import { Bot, Send, X, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import SmartReviAssistant from '@/components/Revy/SmartReviAssistant';

interface AIAssistantSidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const AIAssistantSidebar: React.FC<AIAssistantSidebarProps> = ({
  isCollapsed = false,
  onToggleCollapse
}) => {
  return (
    <div className={`flex flex-col bg-white border-l border-gray-200 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-80'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-revio-500" />
            <span className="font-medium text-gray-900">Assistent</span>
          </div>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="text-gray-500 hover:text-gray-700"
        >
          {isCollapsed ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
        </Button>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="flex-1 overflow-hidden">
          <div className="h-full p-0">
            <SmartReviAssistant embedded />
          </div>
        </div>
      )}

      {/* Collapsed state */}
      {isCollapsed && (
        <div className="flex-1 flex flex-col items-center justify-start pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="p-2 text-revio-500 hover:text-revio-600 hover:bg-revio-50"
          >
            <Bot className="h-6 w-6" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default AIAssistantSidebar;