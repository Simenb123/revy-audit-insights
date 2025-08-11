import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Settings2 } from 'lucide-react';
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
    <div className="w-full space-y-2">
      {/* Rad 1: Primærvalg */}
      <div className="flex flex-wrap items-center gap-3">
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
        {onSearchQueryChange && (
          <div className="flex items-center gap-2">
            <Label htmlFor={`search-${widgetId}`} className="text-xs text-muted-foreground">Søk</Label>
            <Input id={`search-${widgetId}`} value={searchQuery || ''} onChange={(e) => onSearchQueryChange?.(e.target.value)} placeholder="Søk linjer…" className="h-7 w-40" disabled={disabled} />
          </div>
        )}
      </div>

      {/* Rad 2: Handlinger + Flere innstillinger */}
      <div className="flex flex-wrap items-center gap-2">
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
        <div className="grow" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2" disabled={disabled}>
              <Settings2 className="h-4 w-4" />
              Flere innstillinger
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>Visning</DropdownMenuLabel>
            {onShowOnlyChangesChange && (
              <div className="flex items-center justify-between px-2 py-1.5">
                <span className="text-xs text-muted-foreground">Kun endringer</span>
                <Switch id={`changes-${widgetId}`} checked={!!showOnlyChanges} onCheckedChange={onShowOnlyChangesChange} disabled={disabled} />
              </div>
            )}
            {onShowOnlyUnmappedChange && (
              <div className="flex items-center justify-between px-2 py-1.5">
                <span className="text-xs text-muted-foreground">Kun umappede{typeof unmappedCount === 'number' ? ` (${unmappedCount})` : ''}</span>
                <Switch id={`unmapped-${widgetId}`} checked={!!showOnlyUnmapped} onCheckedChange={onShowOnlyUnmappedChange} disabled={disabled} />
              </div>
            )}
            <DropdownMenuSeparator />
            {onInlineAccountsChange && (
              <div className="flex items-center justify-between px-2 py-1.5">
                <span className="text-xs text-muted-foreground">Kontoer i tabell</span>
                <Switch id={`inline-${widgetId}`} checked={!!inlineAccounts} onCheckedChange={onInlineAccountsChange} disabled={disabled || !!drilldownPanel} />
              </div>
            )}
            {onDrilldownPanelChange && (
              <div className="flex items-center justify-between px-2 py-1.5">
                <span className="text-xs text-muted-foreground">Drilldown i panel</span>
                <Switch id={`panel-${widgetId}`} checked={!!drilldownPanel} onCheckedChange={onDrilldownPanelChange} disabled={disabled || !!inlineAccounts} />
              </div>
            )}
            {onAlwaysShowTopHeadersChange && (
              <div className="flex items-center justify-between px-2 py-1.5">
                <span className="text-xs text-muted-foreground">Toppnivå</span>
                <Switch id={`top-${widgetId}`} checked={!!alwaysShowTopHeaders} onCheckedChange={onAlwaysShowTopHeadersChange} disabled={disabled} />
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default StatementTableToolbar;
