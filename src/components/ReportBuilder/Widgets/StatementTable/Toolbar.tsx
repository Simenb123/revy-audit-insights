import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

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
  drilldownPanel?: boolean;
  onDrilldownPanelChange?: (v: boolean) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onExpandToLevel?: (level: number) => void;
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
  drilldownPanel,
  onDrilldownPanelChange,
  onExpandAll,
  onCollapseAll,
  onExpandToLevel
}: StatementTableToolbarProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Label htmlFor={`prev-${widgetId}`} className="text-xs text-muted-foreground">Fjorår</Label>
        <Switch id={`prev-${widgetId}`} checked={showPrevious} onCheckedChange={onShowPreviousChange} />
      </div>
      <div className="flex items-center gap-2">
        <Label htmlFor={`diff-${widgetId}`} className="text-xs text-muted-foreground">Endring</Label>
        <Switch id={`diff-${widgetId}`} checked={showDifference} onCheckedChange={onShowDifferenceChange} />
      </div>
      <div className="flex items-center gap-2">
        <Label htmlFor={`pct-${widgetId}`} className="text-xs text-muted-foreground">%</Label>
        <Switch id={`pct-${widgetId}`} checked={showPercent} onCheckedChange={onShowPercentChange} />
      </div>
      {onShowOnlyChangesChange && (
        <div className="flex items-center gap-2">
          <Label htmlFor={`changes-${widgetId}`} className="text-xs text-muted-foreground">Kun endringer</Label>
          <Switch id={`changes-${widgetId}`} checked={!!showOnlyChanges} onCheckedChange={onShowOnlyChangesChange} />
        </div>
      )}
      {onDrilldownPanelChange && (
        <div className="flex items-center gap-2">
          <Label htmlFor={`panel-${widgetId}`} className="text-xs text-muted-foreground">Drilldown i panel</Label>
          <Switch id={`panel-${widgetId}`} checked={!!drilldownPanel} onCheckedChange={onDrilldownPanelChange} />
        </div>
      )}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onExpandAll}>Utvid alle</Button>
        <Button variant="ghost" size="sm" onClick={onCollapseAll}>Lukk alle</Button>
        {onExpandToLevel && (
          <div className="flex items-center gap-1">
            <Label className="text-xs text-muted-foreground">Nivå</Label>
            <Button variant="ghost" size="sm" onClick={() => onExpandToLevel(1)} aria-label="Utvid til nivå 1">1</Button>
            <Button variant="ghost" size="sm" onClick={() => onExpandToLevel(2)} aria-label="Utvid til nivå 2">2</Button>
            <Button variant="ghost" size="sm" onClick={() => onExpandToLevel(3)} aria-label="Utvid til nivå 3">3</Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default StatementTableToolbar;
