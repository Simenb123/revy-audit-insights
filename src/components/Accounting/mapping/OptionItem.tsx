import React from 'react';
import { CommandItem } from '@/components/ui/command';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HighlightedText } from './HighlightedText';
import { StandardAccountOption } from './types';

interface OptionItemProps {
  opt: StandardAccountOption;
  isActive: boolean;
  isSelected: boolean;
  onSelect: () => void;
  listboxId: string;
  effectiveQuery: string;
  numberRanges?: Array<[number, number]>;
  nameRanges?: Array<[number, number]>;
}

export function OptionItem({ opt, isActive, isSelected, onSelect, listboxId, effectiveQuery, numberRanges, nameRanges }: OptionItemProps) {
  return (
    <CommandItem
      key={opt.id}
      id={`${listboxId}-opt-${opt.id}`}
      value={`${opt.standard_number} ${opt.standard_name}`}
      onSelect={onSelect}
      className={cn('text-sm', isActive && 'bg-accent text-accent-foreground')}
      role="option"
      aria-selected={isSelected}
    >
      <Check className={cn('mr-2 h-4 w-4', isSelected ? 'opacity-100' : 'opacity-0')} />
      <span className="mr-1">
        <HighlightedText text={opt.standard_number} query={effectiveQuery} ranges={numberRanges} />
      </span>
      <span className="text-muted-foreground">-</span>
      <span className="ml-1">
        <HighlightedText text={opt.standard_name} query={effectiveQuery} ranges={nameRanges} />
      </span>
    </CommandItem>
  );
}
