import React from 'react';
import { Widget, useWidgetManager } from '@/contexts/WidgetManagerContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { InlineEditableTitle } from '../InlineEditableTitle';
import { useDetailedFinancialStatement } from '@/hooks/useDetailedFinancialStatement';
import { useTrialBalanceMappings } from '@/hooks/useTrialBalanceMappings';
import { useTrialBalanceData } from '@/hooks/useTrialBalanceData';
import { useNavigate } from 'react-router-dom';
import { StatementLineRow } from './StatementTable/StatementLineRow';
import { SectionHeading } from './StatementTable/SectionHeading';
import { StatementTableToolbar } from './StatementTable/Toolbar';
import { HelpCircle } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { formatCurrency } from '@/lib/formatters';

interface StatementTableWidgetProps { widget: Widget }

const ARIA_HELP_TITLE = 'Tilgjengelighet (ARIA)';
const ARIA_HELP_TEXT = 'Tabellen er et hierarki (treegrid). Bruk piltaster for å åpne/lukke rader og Enter/Space for drilldown. Skjermlesere mottar nivå, posisjon og kolonne-/radantall.';

export function StatementTableWidget({ widget }: StatementTableWidgetProps) {
  const { updateWidget } = useWidgetManager();
  const clientId: string | undefined = widget.config?.clientId;
  const selectedVersion: string | undefined = widget.config?.selectedVersion;
  const showPrevious: boolean = widget.config?.showPrevious !== false;
  const showDifference: boolean = widget.config?.showDifference !== false;
  const showPercent: boolean = widget.config?.showPercent !== false;
  const showOnlyChanges: boolean = widget.config?.showOnlyChanges === true;
  const drilldownPanel: boolean = widget.config?.drilldownPanel === true;

  const { incomeStatement, balanceStatement, periodInfo, isLoading } = useDetailedFinancialStatement(
    clientId || '',
    selectedVersion
  );
  const { data: mappings = [] } = useTrialBalanceMappings(clientId || '');
  const navigate = useNavigate();

  const [expanded, setExpanded] = React.useState<Record<string, boolean>>(() => (widget.config?.expanded ?? {}));
  const [liveMessage, setLiveMessage] = React.useState<string>('');
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [panelContext, setPanelContext] = React.useState<{ standardNumber: string; accounts: string[] } | null>(null);

  const handleTitleChange = (newTitle: string) => updateWidget(widget.id, { title: newTitle });

  const updateConfig = React.useCallback((patch: Record<string, any>) => {
    updateWidget(widget.id, { config: { ...(widget.config || {}), ...patch } });
  }, [updateWidget, widget.id, widget.config]);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      updateConfig({ expanded: next });
      return next;
    });
  };
  const collectIds = (nodes: any[]): string[] =>
    nodes.flatMap((n) => [n.id, ...(n.children ? collectIds(n.children) : [])]);

  const expandAll = () => {
    const all = [...collectIds(incomeStatement || []), ...collectIds(balanceStatement || [])];
    const map = Object.fromEntries(all.map((id) => [id, true] as const));
    setExpanded(map);
    updateConfig({ expanded: map });
    setLiveMessage('Alle rader utvidet');
  };

  const collapseAll = () => {
    setExpanded({});
    updateConfig({ expanded: {} });
    setLiveMessage('Alle rader lukket');
  };

  const getAccountsForLine = React.useCallback((standardNumber: string) => {
    return mappings.filter(m => m.statement_line_number === standardNumber).map(m => m.account_number);
  }, [mappings]);

  const handleDrilldown = (standardNumber: string) => {
    if (!clientId) return;
    const accounts = getAccountsForLine(standardNumber);
    if (accounts.length === 0) return;
    if (drilldownPanel) {
      setPanelContext({ standardNumber, accounts });
      setPanelOpen(true);
      return;
    }
    const params = new URLSearchParams({ accounts: accounts.join(',') });
    navigate(`/clients/${clientId}/trial-balance?${params.toString()}`);
  };
  const openAccountTB = (accountNumber: string) => {
    if (!clientId) return;
    const params = new URLSearchParams({ accounts: accountNumber });
    navigate(`/clients/${clientId}/trial-balance?${params.toString()}`);
  };

  // Helper: filter tree to only include lines with changes (or descendants with changes)
  const hasChange = React.useCallback((node: any): boolean => {
    const current = node.amount || 0;
    const prev = node.previous_amount || 0;
    const changed = current !== prev;
    if (changed) return true;
    if (node.children && node.children.length) {
      return node.children.some((c: any) => hasChange(c));
    }
    return false;
  }, []);

  const filterLines = React.useCallback((nodes: any[]): any[] => {
    if (!showOnlyChanges) return nodes;
    const recurse = (arr: any[]): any[] => arr
      .map((n) => ({ ...n, children: n.children ? recurse(n.children) : [] }))
      .filter((n) => hasChange(n) || (n.children && n.children.length > 0));
    return recurse(nodes);
  }, [showOnlyChanges, hasChange]);

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <InlineEditableTitle title={widget.title} onTitleChange={handleTitleChange} size="sm" />
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Laster regnskapsoppstilling…</div>
        </CardContent>
      </Card>
    );
  }

  const rawIncome = incomeStatement || [];
  const rawBalance = balanceStatement || [];
  const filteredIncome = filterLines(rawIncome);
  const filteredBalance = filterLines(rawBalance);

  const hasData = (filteredIncome?.length ?? 0) > 0 || (filteredBalance?.length ?? 0) > 0;

  const colCount = 1 + 1 + (showPrevious ? 1 : 0) + (showDifference ? 1 : 0) + (showPercent ? 1 : 0);
  const countVisibleLines = React.useCallback(function countVisibleLines(nodes: any[]): number {
    return nodes.reduce((sum: number, n: any) => {
      const self = 1;
      const children = n.children && n.children.length && expanded[n.id] ? countVisibleLines(n.children) : 0;
      return sum + self + children;
    }, 0);
  }, [expanded]);

  const rowCount =
    (filteredIncome.length > 0 ? 1 + countVisibleLines(filteredIncome) : 0) +
    (filteredBalance.length > 0 ? 1 + countVisibleLines(filteredBalance) : 0);

  const headerRowIndex = 1;
  const incomeHeadingIndex = filteredIncome.length > 0 ? headerRowIndex + 1 : undefined;
  const incomeStartIndex = incomeHeadingIndex ? incomeHeadingIndex + 1 : undefined;
  const incomeRowsCount = filteredIncome.length > 0 ? countVisibleLines(filteredIncome) : 0;
  const balanceHeadingIndex = filteredBalance.length > 0
    ? headerRowIndex + (filteredIncome.length > 0 ? 1 + incomeRowsCount : 0) + 1
    : undefined;
  const balanceStartIndex = balanceHeadingIndex ? balanceHeadingIndex + 1 : undefined;

  // Trial balance data for drilldown panel
  const { data: tbCurrent } = useTrialBalanceData(clientId || '', selectedVersion, periodInfo?.currentYear);
  const { data: tbPrev } = useTrialBalanceData(clientId || '', selectedVersion, periodInfo?.previousYear);

  const currentByAcc = React.useMemo(() => new Map((tbCurrent || []).map((e: any) => [e.account_number, e])), [tbCurrent]);
  const prevByAcc = React.useMemo(() => new Map((tbPrev || []).map((e: any) => [e.account_number, e])), [tbPrev]);

  const findLineTitle = React.useCallback((standardNumber: string): string => {
    const findIn = (nodes: any[]): any | undefined => {
      for (const n of nodes) {
        if (n.standard_number === standardNumber) return n;
        if (n.children) {
          const found = findIn(n.children);
          if (found) return found;
        }
      }
      return undefined;
    };
    const node = findIn(filteredIncome) || findIn(filteredBalance);
    return node?.standard_name || standardNumber;
  }, [filteredIncome, filteredBalance]);

  // CSV export of currently visible rows
  const flattenVisible = React.useCallback((nodes: any[]): any[] => {
    const out: any[] = [];
    const walk = (arr: any[]) => {
      for (const n of arr) {
        out.push(n);
        if (n.children && n.children.length && expanded[n.id]) walk(n.children);
      }
    };
    walk(nodes);
    return out;
  }, [expanded]);

  const handleExportCSV = React.useCallback(() => {
    const visibleIncome = flattenVisible(filteredIncome);
    const visibleBalance = flattenVisible(filteredBalance);
    const rows = [
      ...visibleIncome.map((n) => ({ section: 'Resultat', ...n })),
      ...visibleBalance.map((n) => ({ section: 'Balanse', ...n })),
    ];
    const headers = [
      'Seksjon',
      'Nummer',
      'Navn',
      periodInfo?.currentYear ?? 'År',
      ...(showPrevious ? [periodInfo?.previousYear ?? 'I fjor'] : []),
      ...(showDifference ? ['Endring'] : []),
      ...(showPercent ? ['Endring %'] : []),
    ];
    const csv = [
      headers.join(';'),
      ...rows.map((r) => {
        const current = r.amount || 0;
        const prev = r.previous_amount || 0;
        const diff = current - prev;
        const pct = prev !== 0 ? (diff / Math.abs(prev)) * 100 : 0;
        const cols = [
          r.section,
          r.standard_number,
          r.standard_name,
          String(current),
          ...(showPrevious ? [String(prev)] : []),
          ...(showDifference ? [String(diff)] : []),
          ...(showPercent ? [pct.toFixed(1)] : []),
        ];
        return cols.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';');
      })
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-${periodInfo?.currentYear ?? ''}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredIncome, filteredBalance, flattenVisible, periodInfo, showPrevious, showDifference, showPercent]);

  return (
    <>
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <InlineEditableTitle title={widget.title} onTitleChange={handleTitleChange} size="sm" />
            <div className="flex items-center gap-1 print:hidden">
              <StatementTableToolbar
                widgetId={widget.id}
                showPrevious={showPrevious}
                onShowPreviousChange={(v) => updateConfig({ showPrevious: v })}
                showDifference={showDifference}
                onShowDifferenceChange={(v) => updateConfig({ showDifference: v })}
                showPercent={showPercent}
                onShowPercentChange={(v) => updateConfig({ showPercent: v })}
                showOnlyChanges={showOnlyChanges}
                onShowOnlyChangesChange={(v: boolean) => updateConfig({ showOnlyChanges: v })}
                drilldownPanel={drilldownPanel}
                onDrilldownPanelChange={(v: boolean) => updateConfig({ drilldownPanel: v })}
                onExpandAll={expandAll}
                onCollapseAll={collapseAll}
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label={ARIA_HELP_TITLE} className="h-7 w-7">
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs" side="bottom">
                    <p className="font-medium">{ARIA_HELP_TITLE}</p>
                    <p className="text-muted-foreground">{ARIA_HELP_TEXT}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button variant="ghost" size="sm" onClick={handleExportCSV} className="ml-1">Eksporter CSV</Button>
              <Button variant="ghost" size="sm" onClick={() => window.print()} className="ml-1">Skriv ut</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <span aria-live="polite" className="sr-only" role="status">{liveMessage}</span>
          {!hasData ? (
            <div className="p-4 text-sm text-muted-foreground">Ingen data å vise.</div>
          ) : (
              <div className="overflow-x-auto">
                <Table role="treegrid" aria-label="Finansoppstilling" aria-colcount={colCount} aria-rowcount={rowCount}>
                <TableHeader>
                  <TableRow role="row" aria-rowindex={headerRowIndex} className="[&_th]:sticky [&_th]:top-0 bg-background z-10">
                    <TableHead role="columnheader" aria-colindex={1} className="text-xs sticky left-0 z-20 bg-background">Linje</TableHead>
                    <TableHead role="columnheader" aria-colindex={2} className="text-xs text-right whitespace-nowrap">{periodInfo?.currentYear ?? 'År'}</TableHead>
                    {showPrevious && (
                      <TableHead role="columnheader" aria-colindex={3} className="text-xs text-right whitespace-nowrap">{periodInfo?.previousYear ?? 'I fjor'}</TableHead>
                    )}
                    {showDifference && (
                      <TableHead role="columnheader" aria-colindex={2 + (showPrevious ? 1 : 0) + 1} className="text-xs text-right whitespace-nowrap">Endring</TableHead>
                    )}
                    {showPercent && (
                      <TableHead role="columnheader" aria-colindex={2 + (showPrevious ? 1 : 0) + (showDifference ? 1 : 0) + 1} className="text-xs text-right whitespace-nowrap">Endring %</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
              <TableBody>
                {filteredIncome.length > 0 && (
                  <>
                    <SectionHeading title="Resultat" rowIndex={incomeHeadingIndex} colSpan={2 + (showPrevious ? 1 : 0) + (showDifference ? 1 : 0) + (showPercent ? 1 : 0)} />
                    {filteredIncome.map((line, idx, arr) => (
                      <StatementLineRow
                        key={line.id}
                        line={line}
                        level={0}
                        expandedMap={expanded}
                        toggle={toggle}
                        showPrevious={showPrevious}
                        showDifference={showDifference}
                        showPercent={showPercent}
                        onDrilldown={handleDrilldown}
                        siblingIndex={idx + 1}
                        siblingCount={arr.length}
                        rowIndex={(incomeStartIndex ?? 0) + countVisibleLines(filteredIncome.slice(0, idx))}
                        tabIndex={idx === 0 ? 0 : -1}
                      />
                    ))}
                  </>
                )}
                {filteredBalance.length > 0 && (
                  <>
                    <SectionHeading title="Balanse" rowIndex={balanceHeadingIndex} colSpan={2 + (showPrevious ? 1 : 0) + (showDifference ? 1 : 0) + (showPercent ? 1 : 0)} />
                    {filteredBalance.map((line, idx, arr) => (
                      <StatementLineRow
                        key={line.id}
                        line={line}
                        level={0}
                        expandedMap={expanded}
                        toggle={toggle}
                        showPrevious={showPrevious}
                        showDifference={showDifference}
                        showPercent={showPercent}
                        onDrilldown={handleDrilldown}
                        siblingIndex={idx + 1}
                        siblingCount={arr.length}
                        rowIndex={(balanceStartIndex ?? 0) + countVisibleLines(filteredBalance.slice(0, idx))}
                      />
                    ))}
                  </>
                )}
              </TableBody>
                </Table>
              </div>
          )}
        </CardContent>
      </Card>

      {drilldownPanel && panelContext && (
        <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
          <SheetContent side="right" className="w-[min(480px,100vw)]">
            <div className="space-y-3">
              <div>
                <h2 className="text-base font-medium">{findLineTitle(panelContext.standardNumber)}</h2>
                <p className="text-xs text-muted-foreground">{panelContext.standardNumber}</p>
              </div>
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Konto</TableHead>
                      <TableHead className="text-right">{periodInfo?.currentYear ?? 'År'}</TableHead>
                      {showPrevious && (
                        <TableHead className="text-right">{periodInfo?.previousYear ?? 'I fjor'}</TableHead>
                      )}
                      <TableHead className="text-right">Endring</TableHead>
                      <TableHead className="text-right">Lenke</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {panelContext.accounts.map((acc) => {
                      const cur = currentByAcc.get(acc);
                      const prev = prevByAcc.get(acc);
                      const currentVal = cur?.closing_balance || 0;
                      const prevVal = prev?.closing_balance || 0;
                      const diff = currentVal - prevVal;
                      const name = cur?.account_name || prev?.account_name || '';
                      return (
                        <TableRow key={acc}>
                          <TableCell className="whitespace-nowrap">{acc} {name && <span className="text-muted-foreground">- {name}</span>}</TableCell>
                          <TableCell className="text-right tabular-nums whitespace-nowrap">{formatCurrency(currentVal)}</TableCell>
                          {showPrevious && (
                            <TableCell className="text-right tabular-nums whitespace-nowrap">{formatCurrency(prevVal)}</TableCell>
                          )}
                          <TableCell className="text-right tabular-nums whitespace-nowrap">{formatCurrency(diff)}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => openAccountTB(acc)}>Vis i TB</Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
