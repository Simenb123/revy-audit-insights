import React from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from '@/components/ui/command';
import { ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVirtualizer } from '@tanstack/react-virtual';
import { OptionItem } from './mapping/OptionItem';
import { AriaAnnouncer } from './mapping/AriaAnnouncer';
import { useMappingCombobox } from './mapping/useMappingCombobox';
import { MappingComboboxLabels, StandardAccountOption } from './mapping/types';
import { LoadingState } from './mapping/LoadingState';
import { EmptyState } from './mapping/EmptyState';

interface MappingComboboxProps {
  value?: string;
  onChange: (standardNumber: string) => void;
  options: StandardAccountOption[];
  placeholder?: string;
  className?: string;
  allowClear?: boolean;
  loading?: boolean;
  labels?: MappingComboboxLabels;
  fuzzy?: boolean;
  maxResults?: number;
  minFuzzyQueryLength?: number;
}

const MappingCombobox: React.FC<MappingComboboxProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Velg regnskapslinje',
  className,
  allowClear = true,
  loading = false,
  labels,
  fuzzy = false,
  maxResults,
  minFuzzyQueryLength,
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
    matchesById,
    setQuery,
    onOpenChange,
    selectOption,
    clearSelection,
    handleInputKeyDown,
  } = useMappingCombobox({ value, onChange, options, labels, allowClear, fuzzy, maxResults, minFuzzyQueryLength });

  // Virtualization setup
  const parentRef = React.useRef<HTMLDivElement | null>(null);
  const hasClear = !!(allowClear && value);
  const itemCount = filtered.length + (hasClear ? 1 : 0);
  const rowVirtualizer = useVirtualizer({
    count: itemCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36,
    overscan: 8,
  });

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
          disabled={loading}
          aria-busy={loading}
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
            {loading ? (
              <span
                className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-border border-t-primary"
                aria-hidden="true"
              />
            ) : (
              <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
            )}
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
          <CommandList
            id={listboxId}
            role="listbox"
            aria-label={labels?.listAriaLabel ?? 'Regnskapslinjer'}
            className="max-h-[min(60vh,480px)] overflow-auto bg-popover"
            ref={parentRef}
            aria-busy={loading}
          >
            {loading ? (
              <LoadingState text={labels?.loadingText ?? 'Laster...'} />
            ) : filtered.length === 0 ? (
              <>
                <CommandEmpty>
                  <EmptyState
                    text={labels?.noResults ?? 'Ingen treff'}
                    query={query}
                    onClearSearch={query ? () => setQuery('') : undefined}
                    clearLabel={labels?.clearSearch ?? 'Tøm søk'}
                  />
                </CommandEmpty>
                {hasClear && (
                  <CommandItem
                    id={`${listboxId}-opt-clear`}
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
              </>
            ) : (
              <div style={{ height: rowVirtualizer.getTotalSize(), position: 'relative' }}>
                {rowVirtualizer.getVirtualItems().map((v) => {
                  const isClear = hasClear && v.index === 0;
                  const style: React.CSSProperties = {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${v.start}px)`,
                  };

                  if (isClear) {
                    return (
                      <div key="__clear__" style={style}>
                        <CommandItem
                          id={`${listboxId}-opt-clear`}
                          value="__clear__"
                          onSelect={clearSelection}
                          className="text-sm text-destructive"
                          role="option"
                          aria-selected={false}
                        >
                          <X className="mr-2 h-4 w-4 opacity-70" />
                          {labels?.clearSelection ?? 'Fjern valg'}
                        </CommandItem>
                      </div>
                    );
                  }

                  const optIndex = hasClear ? v.index - 1 : v.index;
                  const opt = filtered[optIndex];

                  return (
                    <div key={opt.id} style={style}>
                      <OptionItem
                        opt={opt}
                        isActive={optIndex === activeIndex}
                        isSelected={value === opt.standard_number}
                        onSelect={() => selectOption(opt)}
                        listboxId={listboxId}
                        effectiveQuery={effectiveQuery}
                        numberRanges={matchesById[opt.id]?.numberRanges}
                        nameRanges={matchesById[opt.id]?.nameRanges}
                      />
                    </div>
                  );
                })}
              </div>
            )}
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
    prev.labels === next.labels &&
    prev.loading === next.loading &&
    prev.fuzzy === next.fuzzy &&
    prev.maxResults === next.maxResults &&
    prev.minFuzzyQueryLength === next.minFuzzyQueryLength
  );
});
