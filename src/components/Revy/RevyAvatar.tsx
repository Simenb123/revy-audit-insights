
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface RevyAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const RevyAvatar: React.FC<RevyAvatarProps> = ({ size = 'md', className }) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarImage src="/lovable-uploads/f813b1e2-df71-4a18-b810-b8b775bf7c90.png" alt="AI-Revy" />
      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
        AI
      </AvatarFallback>
    </Avatar>
  );
};

export default RevyAvatar;
