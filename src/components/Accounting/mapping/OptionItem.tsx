
import React from 'react';
import { CommandItem } from '@/components/ui/command';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HighlightedText } from './HighlightedText';
import { StandardAccountOption } from './types';
import { getBalanceCategory, getBalanceCategoryLabel } from '@/utils/standardAccountCategory';

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
  // Ensure we have valid string values for CommandItem
  const safeStandardNumber = String(opt.standard_number || '');
  const safeStandardName = String(opt.standard_name || '');
  const commandValue = `${safeStandardNumber} ${safeStandardName}`.trim();
  
  return (
    <CommandItem
      key={opt.id}
      id={`${listboxId}-opt-${opt.id}`}
      value={commandValue}
      onSelect={onSelect}
      className={cn('text-sm flex items-center gap-1', isActive && 'bg-accent text-accent-foreground')}
      role="option"
      aria-selected={isSelected}
    >
      <Check className={cn('mr-2 h-4 w-4', isSelected ? 'opacity-100' : 'opacity-0')} />
      <span className="mr-1">
        <HighlightedText text={safeStandardNumber} query={effectiveQuery} ranges={numberRanges} />
      </span>
      <span className="text-muted-foreground">-</span>
      <span className="ml-1">
        <HighlightedText text={safeStandardName} query={effectiveQuery} ranges={nameRanges} />
      </span>
      <span className="ml-auto inline-flex items-center rounded-sm border border-border bg-secondary text-secondary-foreground text-[10px] px-1.5 py-0.5">
        {getBalanceCategory(safeStandardNumber)}
        <span className="sr-only"> {getBalanceCategoryLabel(getBalanceCategory(safeStandardNumber))}</span>
      </span>
    </CommandItem>
  );
}
