import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { AggregateMode } from '@/hooks/useKpiBenchmarkExport';

interface Props {
  groupNames: string[];
  selectedGroup: string;
  onSelectedGroupChange: (v: string) => void;
  aggregateMode: AggregateMode;
  onToggleSum: () => void;
  onToggleAvg: () => void;
  canExport: boolean;
  onExport: () => void;
}

export function BenchmarkControls({
  groupNames,
  selectedGroup,
  onSelectedGroupChange,
  aggregateMode,
  onToggleSum,
  onToggleAvg,
  canExport,
  onExport,
}: Props) {
  return (
    <>
      <Select value={selectedGroup} onValueChange={onSelectedGroupChange}>
        <SelectTrigger className="h-8 w-[160px]">
          <SelectValue placeholder="Alle grupper" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle grupper</SelectItem>
          {groupNames.map((g) => (
            <SelectItem key={g} value={g}>{g}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant={aggregateMode === 'sum' ? 'default' : 'outline'}
        size="sm"
        onClick={onToggleSum}
      >
        Sum
      </Button>
      <Button
        variant={aggregateMode === 'avg' ? 'default' : 'outline'}
        size="sm"
        onClick={onToggleAvg}
      >
        Snitt
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onExport}
        disabled={!canExport}
        title={!canExport ? 'Ingen data å eksportere ennå' : undefined}
      >
        Eksporter benchmark
      </Button>
    </>
  );
}
