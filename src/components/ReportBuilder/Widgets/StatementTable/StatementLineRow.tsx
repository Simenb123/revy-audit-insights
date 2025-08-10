import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface StatementLineRowProps {
  line: any;
  level?: number;
  expandedMap: Record<string, boolean>;
  toggle: (id: string, details?: { name?: string; opening?: boolean; delta?: number }) => void;
  showPrevious: boolean;
  showDifference: boolean;
  showPercent: boolean;
  onDrilldown: (standardNumber: string) => void;
  siblingIndex?: number;
  siblingCount?: number;
  rowIndex: number;
  tabIndex?: number;
  canDrilldown?: (standardNumber: string) => boolean;
  getAccountsForLine?: (standardNumber: string) => string[];
  inlineAccounts?: boolean;
  accountsExpandedMap?: Record<string, boolean>;
  toggleAccounts?: (standardNumber: string, details?: { opening?: boolean; delta?: number }) => void;
  currentByAcc?: Map<string, any>;
  prevByAcc?: Map<string, any>;
  openAccountTB?: (accountNumber: string) => void;
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
  tabIndex,
  canDrilldown,
  getAccountsForLine,
  inlineAccounts,
  accountsExpandedMap,
  toggleAccounts,
  currentByAcc,
  prevByAcc,
  openAccountTB
}: StatementLineRowProps) {
const hasChildren = !!(line.children && line.children.length > 0);
const isOpen = !!expandedMap[line.id];
const current = line.amount || 0;
const prev = line.previous_amount || 0;
const diff = current - prev;
const pct = prev !== 0 ? (diff / Math.abs(prev)) * 100 : 0;
  const isDrillable = canDrilldown ? canDrilldown(line.standard_number) : false;
  const accounts = getAccountsForLine ? (getAccountsForLine(line.standard_number) || []) : [];
  const accountsOpen = !!(inlineAccounts && accountsExpandedMap && accountsExpandedMap[line.standard_number]);
  const canToggleAccounts = !!(inlineAccounts && accounts.length > 0);
  const showChevron = hasChildren || canToggleAccounts;
// Counts visible rows for a node (self + visible descendants)
const countVisible = React.useCallback((node: any): number => {
  let total = 1; // self
  if (inlineAccounts && accountsExpandedMap && getAccountsForLine && accountsExpandedMap[node.standard_number]) {
    total += (getAccountsForLine(node.standard_number) || []).length;
  }
  if (node.children && node.children.length && expandedMap[node.id]) {
    for (const c of node.children) total += countVisible(c);
  }
  return total;
}, [expandedMap, inlineAccounts, accountsExpandedMap, getAccountsForLine]);

  // Count how many rows would be visible if this node were opened (self + descendants respecting current expanded flags on deeper levels)
  const countIfOpened = React.useCallback((node: any): number => {
    let total = 1;
    if (node.children && node.children.length) {
      for (const c of node.children) total += countVisible(c);
    }
    return total;
  }, [countVisible]);

  return (
    <>
      <TableRow
        role="row"
        className={`${isDrillable ? 'cursor-pointer' : 'cursor-default'} hover:bg-muted/40 focus-visible:bg-muted/50 focus-visible:outline-none print:break-inside-avoid`}
onClick={() => { 
  if (isDrillable) {
    if (inlineAccounts && toggleAccounts) {
      const opening = !accountsOpen;
      const delta = accounts.length;
      toggleAccounts(line.standard_number, { opening, delta });
    } else {
      onDrilldown(line.standard_number);
    }
  } else if (hasChildren) { 
    const opening = !isOpen; 
    const delta = Math.max(0, (opening ? countIfOpened(line) : countVisible(line)) - 1);
    toggle(line.id, { name: line.standard_name, opening, delta }); 
  }
}}
        tabIndex={tabIndex ?? -1}
        aria-label={isDrillable ? `Drilldown for ${line.standard_number} ${line.standard_name}` : (hasChildren ? `${isOpen ? 'Lukk' : 'Åpne'} ${line.standard_name}` : line.standard_name)}
        aria-level={level + 1}
        aria-expanded={hasChildren ? isOpen : (canToggleAccounts ? accountsOpen : undefined)}
        aria-posinset={siblingIndex}
        aria-setsize={siblingCount}
        aria-rowindex={rowIndex}
        aria-disabled={!isDrillable && !hasChildren && !canToggleAccounts}
        aria-keyshortcuts="ArrowUp,ArrowDown,ArrowLeft,ArrowRight,Home,End,PageUp,PageDown,Enter,Space"
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
            const nextEl = rows[nextIndex];
            if (nextEl) {
              nextEl.focus();
              nextEl.scrollIntoView({ block: 'nearest', inline: 'nearest' });
            }
          };

          if (e.key === 'ArrowDown') { e.preventDefault(); focusRowAt(1); return; }
          if (e.key === 'ArrowUp') { e.preventDefault(); focusRowAt(-1); return; }
          if (e.key === 'PageDown') { e.preventDefault(); focusRowAt(10); return; }
          if (e.key === 'PageUp') { e.preventDefault(); focusRowAt(-10); return; }
          if (e.key === 'Home') { e.preventDefault(); focusRowAt('home'); return; }
          if (e.key === 'End') { e.preventDefault(); focusRowAt('end'); return; }

if (e.key === 'Enter' || e.key === ' ') {
  e.preventDefault();
  if (isDrillable) {
    if (inlineAccounts && toggleAccounts) {
      const opening = !accountsOpen;
      const delta = accounts.length;
      toggleAccounts(line.standard_number, { opening, delta });
    } else {
      onDrilldown(line.standard_number);
    }
  } else if (hasChildren) {
    const opening = !isOpen;
    const delta = Math.max(0, (opening ? countIfOpened(line) : countVisible(line)) - 1);
    toggle(line.id, { name: line.standard_name, opening, delta });
  }
  return;
}
          if (e.key === 'ArrowRight') {
            if (!hasChildren) return;
            e.preventDefault();
            if (!isOpen) {
              const delta = Math.max(0, countIfOpened(line) - 1);
              toggle(line.id, { name: line.standard_name, opening: true, delta });
            } else {
              focusRowAt(1); // move to first child (next visible row)
            }
            return;
          }
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            if (hasChildren && isOpen) {
              const delta = Math.max(0, countVisible(line) - 1);
              toggle(line.id, { name: line.standard_name, opening: false, delta }); // collapse
              return;
            }
            if (level > 0) {
              const tbody = e.currentTarget.parentElement as HTMLElement | null;
              if (!tbody) return;
              const rows = Array.from(tbody.querySelectorAll('[role="row"]')) as HTMLElement[];
              const currentIndex = rows.indexOf(e.currentTarget as HTMLElement);
              const currentLevel = level + 1;
              for (let i = currentIndex - 1; i >= 0; i--) {
                const lvlAttr = rows[i].getAttribute('aria-level');
                const lvl = lvlAttr ? parseInt(lvlAttr, 10) : NaN;
                if (!Number.isNaN(lvl) && lvl < currentLevel) {
                  rows[i].focus();
                  rows[i].scrollIntoView({ block: 'nearest', inline: 'nearest' });
                  break;
                }
              }
            }
            return;
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
            {showChevron && (
          <button
            type="button"
            className="mr-2 text-muted-foreground hover:text-foreground"
            onClick={(e) => { 
              if (hasChildren) {
                const opening = !isOpen;
                const delta = Math.max(0, (opening ? countIfOpened(line) : countVisible(line)) - 1);
                toggle(line.id, { name: line.standard_name, opening, delta }); 
              } else if (canToggleAccounts && toggleAccounts) {
                const opening = !accountsOpen;
                const delta = accounts.length;
                toggleAccounts(line.standard_number, { opening, delta });
              }
            }}
            aria-label={((hasChildren ? isOpen : accountsOpen) ? 'Lukk' : 'Åpne') + ' ' + line.standard_name}
            title={((hasChildren ? isOpen : accountsOpen) ? 'Lukk' : 'Åpne') + ' ' + line.standard_name}
            aria-expanded={hasChildren ? isOpen : accountsOpen}
            tabIndex={-1}
            aria-hidden="true"
          >
                {(hasChildren ? isOpen : accountsOpen) ? <ChevronDown className="h-4 w-4" aria-hidden="true" /> : <ChevronRight className="h-4 w-4" aria-hidden="true" />}
              </button>
            )}
            <span className="font-mono mr-2 text-muted-foreground">{line.standard_number}</span>
            <span>{line.standard_name}</span>
            {isDrillable && getAccountsForLine && (() => {
              const accounts = getAccountsForLine(line.standard_number) || [];
              const count = accounts.length;
              if (count === 0) return null;
              const preview = accounts.slice(0, 10).join(', ');
              return (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
<Button
  variant="secondary"
  size="sm"
  className="ml-2 h-6 px-2 text-[11px]"
  onClick={(e) => { 
    e.stopPropagation(); 
    if (inlineAccounts && toggleAccounts) {
      const opening = !accountsOpen;
      const delta = accounts.length;
      toggleAccounts(line.standard_number, { opening, delta });
    } else {
      onDrilldown(line.standard_number);
    }
  }}
  aria-label={`Vis kontoer for ${line.standard_number}`}
>
  Kontoer ({count})
</Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <div className="text-xs">
                        {preview}{count > 10 ? ' …' : ''}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })()}
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
      {accountsOpen && accounts.length > 0 && accounts.map((acc: string, i: number) => {
        const cur = currentByAcc?.get(acc);
        const prev = prevByAcc?.get(acc);
        const currentVal = cur?.closing_balance || 0;
        const prevVal = prev?.closing_balance || 0;
        const diffVal = currentVal - prevVal;
        const pctVal = prevVal !== 0 ? (diffVal / Math.abs(prevVal)) * 100 : 0;
        const name = cur?.account_name || prev?.account_name || '';
        const rIndex = rowIndex + i + 1;
        return (
          <TableRow
            key={`acc-${line.standard_number}-${acc}`}
            role="row"
            aria-rowindex={rIndex}
            aria-level={level + 2}
            className="hover:bg-muted/30 print:break-inside-avoid"
          >
            <TableCell role="rowheader" aria-colindex={1} className="text-xs sticky left-0 bg-background z-10 print:static">
              <div
                className="flex items-center"
                style={{
                  // @ts-expect-error -- custom property
                  ['--indent-level']: level + 1,
                  paddingLeft: 'calc(var(--statement-indent-step, 12px) * var(--indent-level))',
                }}
              >
                <span className="font-mono mr-2 text-muted-foreground">{acc}</span>
                <span className="text-muted-foreground">-</span>
                <span className="ml-1">{name}</span>
                {openAccountTB && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2 h-6 px-2"
                    onClick={(e) => { e.stopPropagation(); openAccountTB(acc); }}
                    aria-label={`Vis konto ${acc} i TB`}
                  >
                    Vis i TB
                  </Button>
                )}
              </div>
            </TableCell>
            <TableCell role="gridcell" aria-colindex={2} className="text-right text-xs tabular-nums whitespace-nowrap">{formatCurrency(currentVal)}</TableCell>
            {showPrevious && (
              <TableCell role="gridcell" aria-colindex={3} className="text-right text-xs tabular-nums whitespace-nowrap">{formatCurrency(prevVal)}</TableCell>
            )}
            {showDifference && (
              <TableCell role="gridcell" aria-colindex={2 + (showPrevious ? 1 : 0) + 1} className="text-right text-xs tabular-nums whitespace-nowrap">{formatCurrency(diffVal)}</TableCell>
            )}
            {showPercent && (
              <TableCell role="gridcell" aria-colindex={2 + (showPrevious ? 1 : 0) + (showDifference ? 1 : 0) + 1} className="text-right text-xs tabular-nums whitespace-nowrap">{(pctVal >= 0 ? '+' : '') + pctVal.toFixed(1)}%</TableCell>
            )}
          </TableRow>
        );
      })}
      {hasChildren && isOpen && (() => {
        let next = rowIndex + 1 + (accountsOpen ? accounts.length : 0);
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
              canDrilldown={canDrilldown}
              getAccountsForLine={getAccountsForLine}
              inlineAccounts={inlineAccounts}
              accountsExpandedMap={accountsExpandedMap}
              toggleAccounts={toggleAccounts}
              currentByAcc={currentByAcc}
              prevByAcc={prevByAcc}
              openAccountTB={openAccountTB}
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
