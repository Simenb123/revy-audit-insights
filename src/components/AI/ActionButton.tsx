import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AIAction } from '@/types/enhanced-ai-chat';

interface ActionButtonProps {
  action: AIAction;
  icon?: React.ReactNode;
  className?: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({ 
  action, 
  icon, 
  className 
}) => {
  const getVariantColor = (type: AIAction['type']) => {
    switch (type) {
      case 'inventory':
        return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
      case 'documents':
        return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100';
      case 'wine_cellar':
        return 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100';
      case 'guestbook':
        return 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100';
      case 'checklist':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100';
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={action.handler}
      className={cn(
        'h-auto p-2 text-xs flex flex-col items-center gap-1 min-w-[100px] border',
        getVariantColor(action.type),
        className
      )}
      title={action.description}
    >
      {icon && <div className="shrink-0">{icon}</div>}
      <span className="text-center leading-tight">{action.title}</span>
    </Button>
  );
};