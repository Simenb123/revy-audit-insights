import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SearchableSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
}

export const SearchableSelect = ({
  value,
  onValueChange,
  options,
  placeholder = "Velg...",
  searchPlaceholder = "Søk...",
  disabled = false,
  className
}: SearchableSelectProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Filter and sort options
  const filteredOptions = options
    .filter(option => 
      option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      option.value.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      // Sort numerically if both values are numeric
      const aNum = parseInt(a.value);
      const bNum = parseInt(b.value);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return aNum - bNum;
      }
      // Otherwise sort alphabetically
      return a.value.localeCompare(b.value);
    });

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <Select 
      value={value} 
      onValueChange={onValueChange} 
      disabled={disabled}
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <SelectTrigger className={cn("w-full", className)}>
        <SelectValue placeholder={placeholder}>
          {selectedOption ? selectedOption.label : placeholder}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-background border shadow-lg">
        <div className="p-2 border-b">
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        <div className="max-h-60 overflow-auto">
          {filteredOptions.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground">Ingen treff</div>
          ) : (
            filteredOptions.map((option) => (
              <SelectItem 
                key={option.value} 
                value={option.value}
                className="cursor-pointer hover:bg-accent"
              >
                {option.label}
              </SelectItem>
            ))
          )}
        </div>
      </SelectContent>
    </Select>
  );
};
