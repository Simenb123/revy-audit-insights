
import React from 'react';
import { Brain } from 'lucide-react';

interface RevyAvatarProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const RevyAvatar = ({ size = 'md', className = '' }: RevyAvatarProps) => {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const iconSizes = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={`flex items-center justify-center ${sizeClasses[size]} bg-gradient-to-br from-purple-500 to-blue-600 rounded-full ${className}`}>
      <Brain className={`${iconSizes[size]} text-white`} />
    </div>
  );
};

export default RevyAvatar;
