import React, { useMemo, useState, useDeferredValue, useId, useEffect } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from '@/components/ui/command';
import { ChevronsUpDown, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StandardAccountOption {
  id: string;
  standard_number: string;
  standard_name: string;
}

interface MappingComboboxLabels {
  searchPlaceholder?: string;
  noResults?: string;
  clearSelection?: string;
  listAriaLabel?: string;
  selectedAnnouncement?: (opt: { number: string; name: string }) => string;
  clearedAnnouncement?: string;
  resultsCountAnnouncement?: (count: number, query: string) => string;
  availableCountAnnouncement?: (count: number) => string;
}

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
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const DEBOUNCE_MS = 160;
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);
  const effectiveQuery = useDeferredValue(debouncedQuery);
  const [ariaMessage, setAriaMessage] = useState('');
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const highlight = (text: string, q: string) => {
    const t = String(text);
    const qq = q.trim();
    if (!qq) return t;
    const parts = t.split(new RegExp(`(${escapeRegExp(qq)})`, 'ig'));
    return parts.map((part, i) =>
      part.toLowerCase() === qq.toLowerCase() ? (
        <mark key={i} className="bg-muted text-foreground rounded px-0.5">{part}</mark>
      ) : (
        <React.Fragment key={i}>{part}</React.Fragment>
      )
    );
  };

  const selected = useMemo(
    () => options.find((o) => o.standard_number === value),
    [options, value]
  );
  const listboxId = useId();

  const filtered = useMemo(() => {
    const q = effectiveQuery.trim().toLowerCase();
    if (!q) return options;

    const ranked = options
      .filter(
        (o) =>
          o.standard_number.toLowerCase().includes(q) ||
          o.standard_name.toLowerCase().includes(q)
      )
      .map((o) => {
        const num = o.standard_number.toLowerCase();
        const name = o.standard_name.toLowerCase();
        const score =
          (num === q ? 1000 : 0) +
          (name === q ? 900 : 0) +
          (num.startsWith(q) ? 800 : 0) +
          (name.startsWith(q) ? 700 : 0) +
          (num.includes(q) ? 200 : 0) +
          (name.includes(q) ? 100 : 0);
        return { o, score };
      })
      .sort((a, b) => b.score - a.score)
      .map(({ o }) => o);

    return ranked;
  }, [options, effectiveQuery]);

  useEffect(() => {
    if (!open) return;
    const q = effectiveQuery.trim();
    if (q) {
      setAriaMessage(labels?.resultsCountAnnouncement?.(filtered.length, q) ?? `${filtered.length} treff`);
    } else {
      setAriaMessage(labels?.availableCountAnnouncement?.(options.length) ?? `${options.length} tilgjengelige`);
    }
  }, [effectiveQuery, filtered, options, open]);

  useEffect(() => {
    if (!open) {
      setActiveIndex(-1);
      return;
    }
    setActiveIndex(filtered.length ? 0 : -1);
  }, [open, effectiveQuery, filtered]);

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQuery(''); }}>
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
            {selected
              ? `${selected.standard_number} - ${selected.standard_name}`
              : placeholder}
          </span>
          <span className="ml-2 flex items-center gap-1">
            {allowClear && value && (
              <span
                role="button"
                aria-label={labels?.clearSelection ?? "Fjern valg"}
                className="inline-flex rounded p-0.5 hover:bg-accent hover:text-accent-foreground"
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onClick={(e) => { e.stopPropagation(); onChange(""); setAriaMessage(labels?.clearedAnnouncement ?? "Valg fjernet"); setOpen(false); }}
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
            placeholder={labels?.searchPlaceholder ?? "Søk etter linje..."}
            className="h-9"
            autoFocus
            aria-controls={listboxId}
            aria-activedescendant={activeIndex >= 0 ? `${listboxId}-opt-${filtered[activeIndex].id}` : undefined}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  if (filtered.length > 0) {
                    setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
                  }
                  return;
                }
                if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  if (filtered.length > 0) {
                    setActiveIndex((i) => Math.max(i - 1, 0));
                  }
                  return;
                }
                if (e.key === 'Enter') {
                  const chosen = activeIndex >= 0 ? filtered[activeIndex] : filtered[0];
                  if (chosen) {
                    e.preventDefault();
                    onChange(chosen.standard_number);
                    setAriaMessage(labels?.selectedAnnouncement ? labels.selectedAnnouncement({ number: chosen.standard_number, name: chosen.standard_name }) : `Valgt ${chosen.standard_number} - ${chosen.standard_name}`);
                    setOpen(false);
                  }
                }
                if (e.key === 'Backspace' && query === '' && allowClear && value) {
                  e.preventDefault();
                  onChange('');
                  setAriaMessage(labels?.clearedAnnouncement ?? 'Valg fjernet');
                  setOpen(false);
                }
                if (e.key === 'Escape') {
                  if (query) {
                    e.preventDefault();
                    setQuery('');
                  } else {
                    setOpen(false);
                  }
                }
              }}
          />
          <CommandList id={listboxId} role="listbox" aria-label={labels?.listAriaLabel ?? "Regnskapslinjer"} className="max-h-[min(60vh,480px)] overflow-auto bg-popover">
            <CommandEmpty>{labels?.noResults ?? "Ingen treff"}</CommandEmpty>
            {allowClear && value && (
              <CommandItem
                value="__clear__"
                onSelect={() => {
                  onChange('');
                  setAriaMessage(labels?.clearedAnnouncement ?? 'Valg fjernet');
                  setOpen(false);
                }}
                className="text-sm text-destructive"
                role="option"
                aria-selected={false}
              >
                <X className="mr-2 h-4 w-4 opacity-70" />
                {labels?.clearSelection ?? 'Fjern valg'}
              </CommandItem>
            )}
            {filtered.map((opt) => (
              <CommandItem
                key={opt.id}
                id={`${listboxId}-opt-${opt.id}`}
                value={`${opt.standard_number} ${opt.standard_name}`}
                onSelect={() => {
                  onChange(opt.standard_number);
                  setAriaMessage(labels?.selectedAnnouncement ? labels.selectedAnnouncement({ number: opt.standard_number, name: opt.standard_name }) : `Valgt ${opt.standard_number} - ${opt.standard_name}`);
                  setOpen(false);
                }}
                className="text-sm"
                role="option"
                aria-selected={value === opt.standard_number}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    value === opt.standard_number ? 'opacity-100' : 'opacity-0'
                  )}
                />
                <span className="mr-1">{highlight(opt.standard_number, effectiveQuery)}</span>
                <span className="text-muted-foreground">-</span>
                <span className="ml-1">{highlight(opt.standard_name, effectiveQuery)}</span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
        <div aria-live="polite" role="status" className="sr-only">{ariaMessage}</div>
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
