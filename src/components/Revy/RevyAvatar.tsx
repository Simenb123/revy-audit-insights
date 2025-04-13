
import React from 'react';
import { cn } from '@/lib/utils';

type RevyAvatarProps = {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
};

const RevyAvatar = ({ size = 'md', className, onClick }: RevyAvatarProps) => {
  const sizeClasses = {
    xs: 'w-8 h-8',
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <div 
      className={cn(
        "rounded-full overflow-hidden border-2 border-white bg-white", 
        sizeClasses[size],
        className
      )}
      onClick={onClick}
    >
      <img 
        src="/lovable-uploads/f813b1e2-df71-4a18-b810-b8b775bf7c90.png" 
        alt="Revy"
        className="w-full h-full object-cover"
      />
    </div>
  );
};

export default RevyAvatar;
