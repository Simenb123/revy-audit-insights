
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface RevyAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const RevyAvatar: React.FC<RevyAvatarProps> = ({ size = 'md', className }) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-9 w-9',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarImage src="/lovable-uploads/612dab8b-6862-432e-bba3-712199a82eed.png" alt="AI-Revy" />
      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
        AI
      </AvatarFallback>
    </Avatar>
  );
};

export default RevyAvatar;
