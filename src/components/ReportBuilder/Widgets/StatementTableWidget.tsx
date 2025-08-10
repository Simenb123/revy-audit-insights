import React from 'react';
import { Widget, useWidgetManager } from '@/contexts/WidgetManagerContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { InlineEditableTitle } from '../InlineEditableTitle';
import { useDetailedFinancialStatement } from '@/hooks/useDetailedFinancialStatement';
import { useTrialBalanceMappings } from '@/hooks/useTrialBalanceMappings';
import { useNavigate } from 'react-router-dom';
import { StatementLineRow } from './StatementTable/StatementLineRow';
import { SectionHeading } from './StatementTable/SectionHeading';
import { StatementTableToolbar } from './StatementTable/Toolbar';

interface StatementTableWidgetProps { widget: Widget }


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

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <InlineEditableTitle title={widget.title} onTitleChange={handleTitleChange} size="sm" />
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
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {!hasData ? (
          <div className="p-4 text-sm text-muted-foreground">Ingen data å vise.</div>
        ) : (
            <div className="overflow-x-auto">
              <Table role="treegrid" aria-label="Finansoppstilling" aria-colcount={colCount} aria-rowcount={rowCount}>
            <TableHeader>
              <TableRow className="[&_th]:sticky [&_th]:top-0 bg-background z-10">
                <TableHead className="text-xs sticky left-0 z-20 bg-background">Linje</TableHead>
                <TableHead className="text-xs text-right whitespace-nowrap">{periodInfo?.currentYear ?? 'År'}</TableHead>
                {showPrevious && (
                  <TableHead className="text-xs text-right whitespace-nowrap">{periodInfo?.previousYear ?? 'I fjor'}</TableHead>
                )}
                {showDifference && (
                  <TableHead className="text-xs text-right whitespace-nowrap">Endring</TableHead>
                )}
                {showPercent && (
                  <TableHead className="text-xs text-right whitespace-nowrap">Endring %</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {incomeStatement.length > 0 && (
                <>
                  <SectionHeading title="Resultat" colSpan={2 + (showPrevious ? 1 : 0) + (showDifference ? 1 : 0) + (showPercent ? 1 : 0)} />
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
                    />
                  ))}
                </>
              )}
              {balanceStatement.length > 0 && (
                <>
                  <SectionHeading title="Balanse" colSpan={2 + (showPrevious ? 1 : 0) + (showDifference ? 1 : 0) + (showPercent ? 1 : 0)} />
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
