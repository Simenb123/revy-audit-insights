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
  rowIndex: number;
  tabIndex?: number;
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
  siblingCount,
  rowIndex,
  tabIndex
}: StatementLineRowProps) {
  const hasChildren = !!(line.children && line.children.length > 0);
  const isOpen = !!expandedMap[line.id];
  const current = line.amount || 0;
  const prev = line.previous_amount || 0;
  const diff = current - prev;
  const pct = prev !== 0 ? (diff / Math.abs(prev)) * 100 : 0;
  // Counts visible rows for a node (self + visible descendants)
  const countVisible = React.useCallback((node: any): number => {
    let total = 1; // self
    if (node.children && node.children.length && expandedMap[node.id]) {
      for (const c of node.children) total += countVisible(c);
    }
    return total;
  }, [expandedMap]);

  return (
    <>
      <TableRow
        role="row"
        className="cursor-pointer hover:bg-muted/40 focus-visible:bg-muted/50 focus-visible:outline-none"
        onClick={() => onDrilldown(line.standard_number)}
        tabIndex={tabIndex ?? -1}
        aria-label={`Drilldown for ${line.standard_number} ${line.standard_name}`}
        aria-level={level + 1}
        aria-expanded={hasChildren ? isOpen : undefined}
        aria-posinset={siblingIndex}
        aria-setsize={siblingCount}
        aria-rowindex={rowIndex}
        onKeyDown={(e) => {
          const focusRowAt = (targetIndexDelta: number | 'home' | 'end') => {
            const tbody = e.currentTarget.parentElement as HTMLElement | null;
            if (!tbody) return;
            const rows = Array.from(tbody.querySelectorAll('[role="row"]')) as HTMLElement[];
            const currentIndex = rows.indexOf(e.currentTarget as HTMLElement);
            if (currentIndex === -1) return;
            let nextIndex = currentIndex;
            if (targetIndexDelta === 'home') nextIndex = 0;
            else if (targetIndexDelta === 'end') nextIndex = rows.length - 1;
            else nextIndex = Math.max(0, Math.min(rows.length - 1, currentIndex + (targetIndexDelta as number)));
            rows[nextIndex]?.focus();
          };

          if (e.key === 'ArrowDown') { e.preventDefault(); focusRowAt(1); return; }
          if (e.key === 'ArrowUp') { e.preventDefault(); focusRowAt(-1); return; }
          if (e.key === 'PageDown') { e.preventDefault(); focusRowAt(10); return; }
          if (e.key === 'PageUp') { e.preventDefault(); focusRowAt(-10); return; }
          if (e.key === 'Home') { e.preventDefault(); focusRowAt('home'); return; }
          if (e.key === 'End') { e.preventDefault(); focusRowAt('end'); return; }

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
        <TableCell role="rowheader" aria-colindex={1} className="text-xs sticky left-0 bg-background z-10 print:static">
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
      {hasChildren && isOpen && (() => {
        let next = rowIndex + 1;
        return line.children.map((child: any, idx: number, arr: any[]) => {
          const start = next;
          next += countVisible(child);
          return (
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
              rowIndex={start}
            />
          );
        });
      })()}
    </>
  );
});

export default StatementLineRow;
