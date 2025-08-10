import React, { useMemo, useState, useDeferredValue, useId } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from '@/components/ui/command';
import { ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StandardAccountOption {
  id: string;
  standard_number: string;
  standard_name: string;
}

interface MappingComboboxProps {
  value?: string;
  onChange: (standardNumber: string) => void;
  options: StandardAccountOption[];
  placeholder?: string;
  className?: string;
}

const MappingCombobox: React.FC<MappingComboboxProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Velg regnskapslinje',
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);

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
    const q = deferredQuery.trim().toLowerCase();
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
  }, [options, deferredQuery]);

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
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="z-[70] p-0 w-[min(var(--mapping-popover-width,520px),90vw)] bg-popover border border-border shadow-lg" align="start">
        <Command loop>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Søk etter linje..."
            className="h-9"
            autoFocus
            aria-controls={listboxId}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const first = filtered[0];
                if (first) {
                  e.preventDefault();
                  onChange(first.standard_number);
                  setOpen(false);
                }
              }
            }}
          />
          <CommandList id={listboxId} role="listbox" aria-label="Regnskapslinjer" className="max-h-[min(60vh,480px)] overflow-auto bg-popover">
            <CommandEmpty>Ingen treff</CommandEmpty>
            {filtered.map((opt) => (
              <CommandItem
                key={opt.id}
                value={`${opt.standard_number} ${opt.standard_name}`}
                onSelect={() => {
                  onChange(opt.standard_number);
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
                <span className="mr-1">{highlight(opt.standard_number, query)}</span>
                <span className="text-muted-foreground">-</span>
                <span className="ml-1">{highlight(opt.standard_name, query)}</span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default React.memo(MappingCombobox, (prev, next) => {
  return (
    prev.value === next.value &&
    prev.placeholder === next.placeholder &&
    prev.className === next.className &&
    prev.options === next.options
  );
});
