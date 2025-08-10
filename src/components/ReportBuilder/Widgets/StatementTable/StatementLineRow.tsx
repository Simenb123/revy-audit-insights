import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

interface StatementLineRowProps {
  line: any;
  level?: number;
  expandedMap: Record<string, boolean>;
  toggle: (id: string) => void;
  showPrevious: boolean;
  showDifference: boolean;
  showPercent: boolean;
  onDrilldown: (standardNumber: string) => void;
  siblingIndex?: number;
  siblingCount?: number;
}

export const StatementLineRow = React.memo(function StatementLineRow({
  line,
  level = 0,
  expandedMap,
  toggle,
  showPrevious,
  showDifference,
  showPercent,
  onDrilldown,
  siblingIndex,
  siblingCount
}: StatementLineRowProps) {
  const hasChildren = !!(line.children && line.children.length > 0);
  const isOpen = !!expandedMap[line.id];
  const current = line.amount || 0;
  const prev = line.previous_amount || 0;
  const diff = current - prev;
  const pct = prev !== 0 ? (diff / Math.abs(prev)) * 100 : 0;

  return (
    <>
      <TableRow
        role="row"
        className="cursor-pointer hover:bg-muted/40 focus-visible:bg-muted/50 focus-visible:outline-none"
        onClick={() => onDrilldown(line.standard_number)}
        tabIndex={0}
        aria-label={`Drilldown for ${line.standard_number} ${line.standard_name}`}
        aria-level={level + 1}
        aria-expanded={hasChildren ? isOpen : undefined}
        aria-posinset={siblingIndex}
        aria-setsize={siblingCount}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onDrilldown(line.standard_number);
          }
          if (e.key === 'ArrowRight' && hasChildren && !isOpen) {
            e.preventDefault();
            toggle(line.id);
          }
          if (e.key === 'ArrowLeft' && hasChildren && isOpen) {
            e.preventDefault();
            toggle(line.id);
          }
        }}
      >
        <TableCell role="rowheader" aria-colindex={1} className="text-xs sticky left-0 bg-background z-10">
          <div
            className="flex items-center"
            style={{
              // Use CSS variables to avoid hardcoded spacing
              // @ts-expect-error -- custom property
              ['--indent-level']: level,
              paddingLeft: 'calc(var(--statement-indent-step, 12px) * var(--indent-level))',
            }}
          >
            {hasChildren && (
          <button
            type="button"
            className="mr-2 text-muted-foreground hover:text-foreground"
            onClick={(e) => { e.stopPropagation(); toggle(line.id); }}
            aria-label={(isOpen ? 'Lukk' : 'Åpne') + ' ' + line.standard_name}
            title={(isOpen ? 'Lukk' : 'Åpne') + ' ' + line.standard_name}
            aria-expanded={isOpen}
          >
                {isOpen ? <ChevronDown className="h-4 w-4" aria-hidden="true" /> : <ChevronRight className="h-4 w-4" aria-hidden="true" />}
              </button>
            )}
            <span className="font-mono mr-2 text-muted-foreground">{line.standard_number}</span>
            <span>{line.standard_name}</span>
          </div>
        </TableCell>
        <TableCell role="gridcell" aria-colindex={2} className="text-right text-xs tabular-nums whitespace-nowrap">{formatCurrency(current)}</TableCell>
        {showPrevious && (
          <TableCell role="gridcell" aria-colindex={3} className="text-right text-xs tabular-nums whitespace-nowrap">{formatCurrency(prev)}</TableCell>
        )}
        {showDifference && (
          <TableCell role="gridcell" aria-colindex={2 + (showPrevious ? 1 : 0) + 1} className="text-right text-xs tabular-nums whitespace-nowrap">{formatCurrency(diff)}</TableCell>
        )}
        {showPercent && (
          <TableCell role="gridcell" aria-colindex={2 + (showPrevious ? 1 : 0) + (showDifference ? 1 : 0) + 1} className="text-right text-xs tabular-nums whitespace-nowrap">{(pct >= 0 ? '+' : '') + pct.toFixed(1)}%</TableCell>
        )}
      </TableRow>
      {hasChildren && isOpen && line.children.map((child: any, idx: number, arr: any[]) => (
        <StatementLineRow
          key={child.id}
          line={child}
          level={level + 1}
          expandedMap={expandedMap}
          toggle={toggle}
          showPrevious={showPrevious}
          showDifference={showDifference}
          showPercent={showPercent}
          onDrilldown={onDrilldown}
          siblingIndex={idx + 1}
          siblingCount={arr.length}
        />
      ))}
    </>
  );
});

export default StatementLineRow;
