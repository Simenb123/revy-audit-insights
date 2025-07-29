
import React from 'react';
import { Toggle, toggleVariants } from '@/components/ui/toggle';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { type ToggleProps } from "@radix-ui/react-toggle"
import { type VariantProps } from "class-variance-authority"

type ToolbarButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof toggleVariants> & {
  tooltip: string;
  children: React.ReactNode;
} & ToggleProps;

const ToolbarButton = ({ tooltip, children, ...props }: ToolbarButtonProps) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Toggle size="sm" {...props} aria-label={tooltip}>
          {children}
        </Toggle>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default ToolbarButton;
