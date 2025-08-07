import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface InlineEditableTitleProps {
  title: string;
  onTitleChange: (title: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function InlineEditableTitle({ 
  title, 
  onTitleChange, 
  className,
  size = 'sm'
}: InlineEditableTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (tempTitle.trim() !== '') {
      onTitleChange(tempTitle.trim());
    } else {
      setTempTitle(title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setTempTitle(title);
      setIsEditing(false);
    }
  };

  const sizeClasses = {
    sm: 'text-sm font-medium',
    md: 'text-base font-medium',
    lg: 'text-lg font-semibold'
  };

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={tempTitle}
        onChange={(e) => setTempTitle(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={cn("h-auto p-1 border-0 shadow-none bg-transparent", sizeClasses[size], className)}
      />
    );
  }

  return (
    <h3
      className={cn(
        "cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5 transition-colors",
        sizeClasses[size],
        className
      )}
      onClick={() => setIsEditing(true)}
      title="Klikk for å redigere tittel"
    >
      {title}
    </h3>
  );
}