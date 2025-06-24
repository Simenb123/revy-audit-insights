
import React from 'react';
import { MessageCircle, Sparkles } from 'lucide-react';

interface RevyAvatarProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  variant?: 'default' | 'chat';
}

const RevyAvatar = ({ size = 'md', className = '', variant = 'default' }: RevyAvatarProps) => {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const iconSizes = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const sparklesSizes = {
    xs: 'h-2 w-2',
    sm: 'h-2.5 w-2.5',
    md: 'h-3 w-3',
    lg: 'h-3.5 w-3.5'
  };

  if (variant === 'chat') {
    return (
      <div className={`relative flex items-center justify-center ${sizeClasses[size]} bg-gradient-to-br from-indigo-500 via-purple-500 to-blue-600 rounded-full shadow-md ${className}`}>
        <MessageCircle className={`${iconSizes[size]} text-white`} />
        <Sparkles className={`absolute -top-0.5 -right-0.5 ${sparklesSizes[size]} text-yellow-300 animate-pulse`} />
      </div>
    );
  }

  return (
    <div className={`relative flex items-center justify-center ${sizeClasses[size]} bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 rounded-full shadow-lg border-2 border-white/20 ${className}`}>
      <div className="relative">
        <MessageCircle className={`${iconSizes[size]} text-white`} />
        <Sparkles className={`absolute -top-1 -right-1 ${sparklesSizes[size]} text-yellow-300 animate-pulse`} />
      </div>
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/10 to-transparent"></div>
    </div>
  );
};

export default RevyAvatar;
