import React from 'react';
import { Widget, useWidgetManager } from '@/contexts/WidgetManagerContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { InlineEditableTitle } from '../InlineEditableTitle';
import { useDetailedFinancialStatement } from '@/hooks/useDetailedFinancialStatement';
import { useTrialBalanceMappings } from '@/hooks/useTrialBalanceMappings';
import { useNavigate } from 'react-router-dom';
import { StatementLineRow } from './StatementTable/StatementLineRow';
import { SectionHeading } from './StatementTable/SectionHeading';
import { StatementTableToolbar } from './StatementTable/Toolbar';
import { HelpCircle } from 'lucide-react';

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

  const { incomeStatement, balanceStatement, periodInfo, isLoading } = useDetailedFinancialStatement(
    clientId || '',
    selectedVersion
  );
  const { data: mappings = [] } = useTrialBalanceMappings(clientId || '');
  const navigate = useNavigate();

  const [expanded, setExpanded] = React.useState<Record<string, boolean>>(() => (widget.config?.expanded ?? {}));

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
  };

  const collapseAll = () => {
    setExpanded({});
    updateConfig({ expanded: {} });
  };

  const getAccountsForLine = React.useCallback((standardNumber: string) => {
    return mappings.filter(m => m.statement_line_number === standardNumber).map(m => m.account_number);
  }, [mappings]);

  const handleDrilldown = (standardNumber: string) => {
    if (!clientId) return;
    const accounts = getAccountsForLine(standardNumber);
    if (accounts.length === 0) return;
    const params = new URLSearchParams({ accounts: accounts.join(',') });
    navigate(`/clients/${clientId}/trial-balance?${params.toString()}`);
  };


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

  const hasData = (incomeStatement?.length ?? 0) > 0 || (balanceStatement?.length ?? 0) > 0;

  const colCount = 1 + 1 + (showPrevious ? 1 : 0) + (showDifference ? 1 : 0) + (showPercent ? 1 : 0);
  const countVisibleLines = React.useCallback(function countVisibleLines(nodes: any[]): number {
    return nodes.reduce((sum: number, n: any) => {
      const self = 1;
      const children = n.children && n.children.length && expanded[n.id] ? countVisibleLines(n.children) : 0;
      return sum + self + children;
    }, 0);
  }, [expanded]);

  const rowCount =
    (incomeStatement.length > 0 ? 1 + countVisibleLines(incomeStatement) : 0) +
    (balanceStatement.length > 0 ? 1 + countVisibleLines(balanceStatement) : 0);

  const headerRowIndex = 1;
  const incomeHeadingIndex = incomeStatement.length > 0 ? headerRowIndex + 1 : undefined;
  const incomeStartIndex = incomeHeadingIndex ? incomeHeadingIndex + 1 : undefined;
  const incomeRowsCount = incomeStatement.length > 0 ? countVisibleLines(incomeStatement) : 0;
  const balanceHeadingIndex = balanceStatement.length > 0
    ? headerRowIndex + (incomeStatement.length > 0 ? 1 + incomeRowsCount : 0) + 1
    : undefined;
  const balanceStartIndex = balanceHeadingIndex ? balanceHeadingIndex + 1 : undefined;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <InlineEditableTitle title={widget.title} onTitleChange={handleTitleChange} size="sm" />
          <div className="flex items-center gap-1">
            <StatementTableToolbar
              widgetId={widget.id}
              showPrevious={showPrevious}
              onShowPreviousChange={(v) => updateConfig({ showPrevious: v })}
              showDifference={showDifference}
              onShowDifferenceChange={(v) => updateConfig({ showDifference: v })}
              showPercent={showPercent}
              onShowPercentChange={(v) => updateConfig({ showPercent: v })}
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
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
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
              {incomeStatement.length > 0 && (
                <>
                  <SectionHeading title="Resultat" rowIndex={incomeHeadingIndex} colSpan={2 + (showPrevious ? 1 : 0) + (showDifference ? 1 : 0) + (showPercent ? 1 : 0)} />
                  {incomeStatement.map((line, idx, arr) => (
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
                      rowIndex={(incomeStartIndex ?? 0) + countVisibleLines(incomeStatement.slice(0, idx))}
                    />
                  ))}
                </>
              )}
              {balanceStatement.length > 0 && (
                <>
                  <SectionHeading title="Balanse" rowIndex={balanceHeadingIndex} colSpan={2 + (showPrevious ? 1 : 0) + (showDifference ? 1 : 0) + (showPercent ? 1 : 0)} />
                  {balanceStatement.map((line, idx, arr) => (
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
                      rowIndex={(balanceStartIndex ?? 0) + countVisibleLines(balanceStatement.slice(0, idx))}
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
  );
}
