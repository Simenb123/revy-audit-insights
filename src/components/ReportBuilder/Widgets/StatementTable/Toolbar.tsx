import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
interface StatementTableToolbarProps {
  widgetId: string;
  showPrevious: boolean;
  onShowPreviousChange: (v: boolean) => void;
  showDifference: boolean;
  onShowDifferenceChange: (v: boolean) => void;
  showPercent: boolean;
  onShowPercentChange: (v: boolean) => void;
  showOnlyChanges?: boolean;
  onShowOnlyChangesChange?: (v: boolean) => void;
  inlineAccounts?: boolean;
  onInlineAccountsChange?: (v: boolean) => void;
  drilldownPanel?: boolean;
  onDrilldownPanelChange?: (v: boolean) => void;
  alwaysShowTopHeaders?: boolean;
  onAlwaysShowTopHeadersChange?: (v: boolean) => void;
  searchQuery?: string;
  onSearchQueryChange?: (v: string) => void;
  showOnlyUnmapped?: boolean;
  onShowOnlyUnmappedChange?: (v: boolean) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onExpandToLevel?: (level: number) => void;
  disabled?: boolean;
  sectionMode?: 'both' | 'income' | 'balance';
  onSectionModeChange?: (mode: 'both' | 'income' | 'balance') => void;
}

export function StatementTableToolbar({
  widgetId,
  showPrevious,
  onShowPreviousChange,
  showDifference,
  onShowDifferenceChange,
  showPercent,
  onShowPercentChange,
  showOnlyChanges,
  onShowOnlyChangesChange,
  inlineAccounts,
  onInlineAccountsChange,
  drilldownPanel,
  onDrilldownPanelChange,
  alwaysShowTopHeaders,
  onAlwaysShowTopHeadersChange,
  searchQuery,
  onSearchQueryChange,
  showOnlyUnmapped,
  onShowOnlyUnmappedChange,
  onExpandAll,
  onCollapseAll,
  onExpandToLevel,
  disabled,
  unmappedCount,
  sectionMode,
  onSectionModeChange,
}: StatementTableToolbarProps & { unmappedCount?: number }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Label htmlFor={`prev-${widgetId}`} className="text-xs text-muted-foreground">Fjorår</Label>
        <Switch id={`prev-${widgetId}`} checked={showPrevious} onCheckedChange={onShowPreviousChange} disabled={disabled} />
      </div>
      <div className="flex items-center gap-2">
        <Label htmlFor={`diff-${widgetId}`} className="text-xs text-muted-foreground">Endring</Label>
        <Switch id={`diff-${widgetId}`} checked={showDifference} onCheckedChange={onShowDifferenceChange} disabled={disabled} />
      </div>
      <div className="flex items-center gap-2">
        <Label htmlFor={`pct-${widgetId}`} className="text-xs text-muted-foreground">%</Label>
        <Switch id={`pct-${widgetId}`} checked={showPercent} onCheckedChange={onShowPercentChange} disabled={disabled} />
      </div>
      {onSectionModeChange && (
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Seksjon</Label>
          <Select value={sectionMode || 'both'} onValueChange={(v) => onSectionModeChange(v as 'both' | 'income' | 'balance')} disabled={disabled}>
            <SelectTrigger className="h-7 w-36">
              <SelectValue placeholder="Seksjon" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="both">Begge</SelectItem>
              <SelectItem value="income">Resultat</SelectItem>
              <SelectItem value="balance">Balanse</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      {onShowOnlyChangesChange && (
        <div className="flex items-center gap-2">
          <Label htmlFor={`changes-${widgetId}`} className="text-xs text-muted-foreground">Kun endringer</Label>
          <Switch id={`changes-${widgetId}`} checked={!!showOnlyChanges} onCheckedChange={onShowOnlyChangesChange} disabled={disabled} />
        </div>
      )}
{onInlineAccountsChange && (
  <div className="flex items-center gap-2">
    <Label htmlFor={`inline-${widgetId}`} className="text-xs text-muted-foreground">Kontoer i tabell</Label>
    <Switch id={`inline-${widgetId}`} checked={!!inlineAccounts} onCheckedChange={onInlineAccountsChange} disabled={disabled || !!drilldownPanel} />
  </div>
)}
{onDrilldownPanelChange && (
  <div className="flex items-center gap-2">
    <Label htmlFor={`panel-${widgetId}`} className="text-xs text-muted-foreground">Drilldown i panel</Label>
    <Switch id={`panel-${widgetId}`} checked={!!drilldownPanel} onCheckedChange={onDrilldownPanelChange} disabled={disabled || !!inlineAccounts} />
  </div>
)}
{onAlwaysShowTopHeadersChange && (
  <div className="flex items-center gap-2">
    <Label htmlFor={`top-${widgetId}`} className="text-xs text-muted-foreground">Toppnivå</Label>
    <Switch id={`top-${widgetId}`} checked={!!alwaysShowTopHeaders} onCheckedChange={onAlwaysShowTopHeadersChange} disabled={disabled} />
  </div>
)}
{onShowOnlyUnmappedChange && (
  <div className="flex items-center gap-2">
    <Label htmlFor={`unmapped-${widgetId}`} className="text-xs text-muted-foreground">Kun umappede{typeof unmappedCount === 'number' ? ` (${unmappedCount})` : ''}</Label>
    <Switch id={`unmapped-${widgetId}`} checked={!!showOnlyUnmapped} onCheckedChange={onShowOnlyUnmappedChange} disabled={disabled} />
  </div>
)}
{onSearchQueryChange && (
  <div className="flex items-center gap-2">
    <Label htmlFor={`search-${widgetId}`} className="text-xs text-muted-foreground">Søk</Label>
    <Input id={`search-${widgetId}`} value={searchQuery || ''} onChange={(e) => onSearchQueryChange?.(e.target.value)} placeholder="Søk linjer…" className="h-7 w-40" disabled={disabled} />
  </div>
)}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onExpandAll} disabled={disabled}>Utvid alle</Button>
        <Button variant="ghost" size="sm" onClick={onCollapseAll} disabled={disabled}>Lukk alle</Button>
        {onExpandToLevel && (
          <div className="flex items-center gap-1">
            <Label className="text-xs text-muted-foreground">Nivå</Label>
            <Button variant="ghost" size="sm" onClick={() => onExpandToLevel(1)} aria-label="Utvid til nivå 1" disabled={disabled}>1</Button>
            <Button variant="ghost" size="sm" onClick={() => onExpandToLevel(2)} aria-label="Utvid til nivå 2" disabled={disabled}>2</Button>
            <Button variant="ghost" size="sm" onClick={() => onExpandToLevel(3)} aria-label="Utvid til nivå 3" disabled={disabled}>3</Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default StatementTableToolbar;
