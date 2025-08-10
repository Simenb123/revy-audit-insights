import React, { useState, useMemo, useEffect, useDeferredValue, useId } from 'react';
import { MappingComboboxLabels, StandardAccountOption } from './types';
import Fuse from 'fuse.js';

interface UseMappingComboboxParams {
  value?: string;
  onChange: (standardNumber: string) => void;
  options: StandardAccountOption[];
  labels?: MappingComboboxLabels;
  allowClear: boolean;
  fuzzy?: boolean;
}

export function useMappingCombobox({ value, onChange, options, labels, allowClear, fuzzy }: UseMappingComboboxParams) {
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

  const selected = useMemo(
    () => options.find((o) => o.standard_number === value),
    [options, value]
  );

  const listboxId = useId();

  const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const normalizedOptions = useMemo(() => (
  options.map((o) => {
    const numN = normalize(o.standard_number);
    const nameN = normalize(o.standard_name);
    return { o, numN, nameN, combined: `${numN} ${nameN}` };
  })
), [options]);

const fuseIndex = useMemo(() => {
  if (!fuzzy) return null;
  return new Fuse(options, {
    includeScore: true,
    includeMatches: true,
    threshold: 0.35,
    ignoreLocation: true,
    minMatchCharLength: 1,
    keys: [
      { name: 'standard_number', weight: 0.7 },
      { name: 'standard_name', weight: 0.3 },
    ],
  });
}, [options, fuzzy]);

const { filtered, matchesById } = useMemo(() => {
  const raw = effectiveQuery.trim();
  const nq = normalize(raw);
  if (!nq) {
    return { filtered: options, matchesById: {} as Record<string, { numberRanges: Array<[number, number]>; nameRanges: Array<[number, number]> }> };
  }

  if (fuzzy && fuseIndex && raw) {
    const results = fuseIndex.search(raw);
    const byId: Record<string, { numberRanges: Array<[number, number]>; nameRanges: Array<[number, number]> }> = {};
    results.forEach((r) => {
      const entry = { numberRanges: [] as Array<[number, number]>, nameRanges: [] as Array<[number, number]> };
      (r.matches || []).forEach((m) => {
        const indices = (m.indices || []) as Array<[number, number]>;
        if (m.key === 'standard_number') entry.numberRanges.push(...indices);
        if (m.key === 'standard_name') entry.nameRanges.push(...indices);
      });
      if (entry.numberRanges.length || entry.nameRanges.length) {
        byId[(r.item as StandardAccountOption).id] = entry;
      }
    });
    return { filtered: results.map((r) => r.item as StandardAccountOption), matchesById: byId };
  }

  const tokens = nq.split(/\s+/).filter(Boolean);

  const ranked = normalizedOptions
    .filter((x) => tokens.every((t) => x.combined.includes(t)))
    .map((x) => {
      const score =
        (x.numN === nq ? 1000 : 0) +
        (x.nameN === nq ? 900 : 0) +
        (x.numN.startsWith(nq) ? 800 : 0) +
        (x.nameN.startsWith(nq) ? 700 : 0) +
        tokens.reduce((acc, t) => acc + (x.numN.includes(t) ? 200 : 0) + (x.nameN.includes(t) ? 100 : 0), 0);
      return { o: x.o, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ o }) => o);

  return { filtered: ranked, matchesById: {} as Record<string, { numberRanges: Array<[number, number]>; nameRanges: Array<[number, number]> }> };
}, [options, effectiveQuery, normalizedOptions, fuzzy, fuseIndex]);

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

  const selectOption = (opt: StandardAccountOption) => {
    onChange(opt.standard_number);
    setAriaMessage(
      labels?.selectedAnnouncement
        ? labels.selectedAnnouncement({ number: opt.standard_number, name: opt.standard_name })
        : `Valgt ${opt.standard_number} - ${opt.standard_name}`
    );
    setOpen(false);
  };

  const clearSelection = () => {
    onChange('');
    setAriaMessage(labels?.clearedAnnouncement ?? 'Valg fjernet');
    setOpen(false);
  };

  const onOpenChange = (o: boolean) => {
    setOpen(o);
    if (!o) {
      setQuery('');
      setActiveIndex(-1);
    } else {
      const idx = filtered.findIndex((x) => x.standard_number === value);
      setActiveIndex(idx >= 0 ? idx : filtered.length ? 0 : -1);
    }
  };

  const handleInputKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
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
        selectOption(chosen);
      }
    }
    if (e.key === 'Backspace' && query === '' && allowClear && value) {
      e.preventDefault();
      clearSelection();
    }
    if (e.key === 'Escape') {
      if (query) {
        e.preventDefault();
        setQuery('');
      } else {
        setOpen(false);
      }
    }
  };

  return {
    // state
    open,
    query,
    effectiveQuery,
    ariaMessage,
    activeIndex,
    selected,
    filtered,
    listboxId,
    matchesById,
    // setters
    setQuery,
    setOpen,
    setActiveIndex,
    setAriaMessage,
    // actions
    selectOption,
    clearSelection,
    onOpenChange,
    handleInputKeyDown,
  } as const;
}
