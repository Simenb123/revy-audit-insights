import React, { useMemo, useState } from 'react';
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

  const selected = useMemo(
    () => options.find((o) => o.standard_number === value),
    [options, value]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.standard_number.toLowerCase().includes(q) ||
        o.standard_name.toLowerCase().includes(q)
    );
  }, [options, query]);

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
          />
          <CommandList className="max-h-[min(60vh,480px)] overflow-auto bg-popover">
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
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    value === opt.standard_number ? 'opacity-100' : 'opacity-0'
                  )}
                />
                {opt.standard_number} - {opt.standard_name}
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
