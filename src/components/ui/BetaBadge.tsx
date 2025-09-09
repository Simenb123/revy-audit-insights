import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface BetaBadgeProps {
  children?: React.ReactNode;
  tooltip?: string;
  variant?: 'default' | 'secondary' | 'outline';
  className?: string;
}

export const BetaBadge: React.FC<BetaBadgeProps> = ({ 
  children = 'Beta',
  tooltip = 'Denne funksjonen er i beta-fase og kan inneholde begrensninger',
  variant = 'secondary',
  className = ''
}) => {
  const badge = (
    <Badge 
      variant={variant} 
      className={`text-xs font-medium ${className}`}
    >
      {children}
    </Badge>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {badge}
          </TooltipTrigger>
          <TooltipContent side="top" align="center">
            <p className="max-w-xs text-sm">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
};