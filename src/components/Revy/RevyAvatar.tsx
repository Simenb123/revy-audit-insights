
import React from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot } from 'lucide-react';

type RevyAvatarProps = {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
};

const RevyAvatar = ({ size = 'md', className, onClick }: RevyAvatarProps) => {
  const sizeClasses = {
    xs: 'w-7 h-7', // 28px
    sm: 'w-8 h-8', // 32px
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <Avatar 
      className={cn(
        "border-2 border-white bg-white shadow-sm", 
        sizeClasses[size],
        className
      )}
      onClick={onClick}
    >
      <AvatarImage 
        src="/lovable-uploads/f813b1e2-df71-4a18-b810-b8b775bf7c90.png" 
        alt="Revy"
        className="object-cover"
      />
      <AvatarFallback className="bg-purple-100 text-purple-600">
        <Bot className="h-1/2 w-1/2" />
      </AvatarFallback>
    </Avatar>
  );
};

export default RevyAvatar;
