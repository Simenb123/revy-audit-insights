import React from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from '@/components/ui/command';
import { ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OptionItem } from './mapping/OptionItem';
import { AriaAnnouncer } from './mapping/AriaAnnouncer';
import { useMappingCombobox } from './mapping/useMappingCombobox';
import { MappingComboboxLabels, StandardAccountOption } from './mapping/types';

interface MappingComboboxProps {
  value?: string;
  onChange: (standardNumber: string) => void;
  options: StandardAccountOption[];
  placeholder?: string;
  className?: string;
  allowClear?: boolean;
  labels?: MappingComboboxLabels;
}

const MappingCombobox: React.FC<MappingComboboxProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Velg regnskapslinje',
  className,
  allowClear = true,
  labels,
}) => {
  const {
    open,
    query,
    effectiveQuery,
    ariaMessage,
    activeIndex,
    selected,
    filtered,
    listboxId,
    setQuery,
    onOpenChange,
    selectOption,
    clearSelection,
    handleInputKeyDown,
  } = useMappingCombobox({ value, onChange, options, labels, allowClear });

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-8 w-[var(--mapping-combobox-width,280px)] justify-between border-input bg-background text-foreground',
            className
          )}
          aria-label={selected ? `Valgt regnskapslinje: ${selected.standard_number} - ${selected.standard_name}` : placeholder}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className="truncate text-xs">
            {selected ? `${selected.standard_number} - ${selected.standard_name}` : placeholder}
          </span>
          <span className="ml-2 flex items-center gap-1">
            {allowClear && value && (
              <span
                role="button"
                aria-label={labels?.clearSelection ?? 'Fjern valg'}
                className="inline-flex rounded p-0.5 hover:bg-accent hover:text-accent-foreground"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  clearSelection();
                }}
              >
                <X className="h-3.5 w-3.5 opacity-70" />
              </span>
            )}
            <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="z-[70] p-0 w-[min(var(--mapping-popover-width,520px),90vw)] bg-popover border border-border shadow-lg" align="start">
        <Command loop>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder={labels?.searchPlaceholder ?? 'Søk etter linje...'}
            className="h-9"
            autoFocus
            role="combobox"
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-expanded={open}
            aria-describedby={`${listboxId}-desc`}
            aria-activedescendant={activeIndex >= 0 ? `${listboxId}-opt-${filtered[activeIndex].id}` : undefined}
            onKeyDown={handleInputKeyDown}
          />
          <div id={`${listboxId}-desc`} className="sr-only">
            Bruk piltastene for å navigere, Enter for å velge, Esc for å lukke. Backspace fjerner valget når søkefeltet er tomt.
          </div>
          <CommandList id={listboxId} role="listbox" aria-label={labels?.listAriaLabel ?? 'Regnskapslinjer'} className="max-h-[min(60vh,480px)] overflow-auto bg-popover">
            <CommandEmpty>{labels?.noResults ?? 'Ingen treff'}</CommandEmpty>
            {allowClear && value && (
              <CommandItem
                value="__clear__"
                onSelect={clearSelection}
                className="text-sm text-destructive"
                role="option"
                aria-selected={false}
              >
                <X className="mr-2 h-4 w-4 opacity-70" />
                {labels?.clearSelection ?? 'Fjern valg'}
              </CommandItem>
            )}
            {filtered.map((opt, idx) => (
              <OptionItem
                key={opt.id}
                opt={opt}
                isActive={idx === activeIndex}
                isSelected={value === opt.standard_number}
                onSelect={() => selectOption(opt)}
                listboxId={listboxId}
                effectiveQuery={effectiveQuery}
              />
            ))}
          </CommandList>
        </Command>
        <AriaAnnouncer message={ariaMessage} />
      </PopoverContent>
    </Popover>
  );
};

export default React.memo(MappingCombobox, (prev, next) => {
  return (
    prev.value === next.value &&
    prev.placeholder === next.placeholder &&
    prev.className === next.className &&
    prev.options === next.options &&
    prev.allowClear === next.allowClear &&
    prev.labels === next.labels
  );
});

