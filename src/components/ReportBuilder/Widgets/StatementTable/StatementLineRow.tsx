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
}

export const StatementLineRow = React.memo(function StatementLineRow({
  line,
  level = 0,
  expandedMap,
  toggle,
  showPrevious,
  showDifference,
  showPercent,
  onDrilldown
}: StatementLineRowProps) {
  const hasChildren = !!(line.children && line.children.length > 0);
  const isOpen = !!expandedMap[line.id];
  const current = line.amount || 0;
  const prev = line.previous_amount || 0;
  const diff = current - prev;
  const pct = prev !== 0 ? (diff / Math.abs(prev)) * 100 : 0;

  return (
    <>
      <TableRow className="cursor-pointer hover:bg-muted/40" onClick={() => onDrilldown(line.standard_number)}>
        <TableCell className="text-xs sticky left-0 bg-background z-10">
          <div className="flex items-center" style={{ paddingLeft: level * 12 }}>
            {hasChildren && (
          <button
            type="button"
            className="mr-2 text-muted-foreground hover:text-foreground"
            onClick={(e) => { e.stopPropagation(); toggle(line.id); }}
            aria-label={isOpen ? 'Lukk' : 'Åpne'}
            aria-expanded={isOpen}
          >
                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            )}
            <span className="font-mono mr-2 text-muted-foreground">{line.standard_number}</span>
            <span>{line.standard_name}</span>
          </div>
        </TableCell>
        <TableCell className="text-right text-xs">{formatCurrency(current)}</TableCell>
        {showPrevious && (
          <TableCell className="text-right text-xs">{formatCurrency(prev)}</TableCell>
        )}
        {showDifference && (
          <TableCell className="text-right text-xs">{formatCurrency(diff)}</TableCell>
        )}
        {showPercent && (
          <TableCell className="text-right text-xs">{(pct >= 0 ? '+' : '') + pct.toFixed(1)}%</TableCell>
        )}
      </TableRow>
      {hasChildren && isOpen && line.children.map((child: any) => (
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
        />
      ))}
    </>
  );
});

export default StatementLineRow;
