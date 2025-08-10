import React from 'react';
import { Widget, useWidgetManager } from '@/contexts/WidgetManagerContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { InlineEditableTitle } from '../InlineEditableTitle';
import { useDetailedFinancialStatement } from '@/hooks/useDetailedFinancialStatement';
import { useTrialBalanceMappings } from '@/hooks/useTrialBalanceMappings';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/lib/formatters';

interface StatementTableWidgetProps { widget: Widget }

function SectionHeading({ title }: { title: string }) {
  return (
    <TableRow>
      <TableCell colSpan={6} className="font-medium text-muted-foreground">{title}</TableCell>
    </TableRow>
  );
}

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

  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});

  const handleTitleChange = (newTitle: string) => updateWidget(widget.id, { title: newTitle });

  const toggle = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

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

  const renderLine = (line: any, level = 0): React.ReactNode => {
    const hasChildren = line.children && line.children.length > 0;
    const isOpen = !!expanded[line.id];
    const current = line.amount || 0;
    const prev = line.previous_amount || 0;
    const diff = current - prev;
    const pct = prev !== 0 ? (diff / Math.abs(prev)) * 100 : 0;

    return (
      <React.Fragment key={line.id}>
        <TableRow className="cursor-pointer hover:bg-muted/40" onClick={() => handleDrilldown(line.standard_number)}>
          <TableCell className="text-xs">
            <div className="flex items-center" style={{ paddingLeft: level * 12 }}>
              {hasChildren && (
                <button
                  type="button"
                  className="mr-2 text-muted-foreground hover:text-foreground"
                  onClick={(e) => { e.stopPropagation(); toggle(line.id); }}
                  aria-label={isOpen ? 'Lukk' : 'Åpne'}
                >
                  {isOpen ? '−' : '+'}
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
        {hasChildren && isOpen && line.children.map((child: any) => renderLine(child, level + 1))}
      </React.Fragment>
    );
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

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <InlineEditableTitle title={widget.title} onTitleChange={handleTitleChange} size="sm" />
        {/* Optional: could add small toggles here later */}
      </CardHeader>
      <CardContent className="p-0">
        {!hasData ? (
          <div className="p-4 text-sm text-muted-foreground">Ingen data å vise.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Linje</TableHead>
                <TableHead className="text-xs text-right">{periodInfo?.currentYear ?? 'År'}</TableHead>
                {showPrevious && (
                  <TableHead className="text-xs text-right">{periodInfo?.previousYear ?? 'I fjor'}</TableHead>
                )}
                {showDifference && (
                  <TableHead className="text-xs text-right">Endring</TableHead>
                )}
                {showPercent && (
                  <TableHead className="text-xs text-right">Endring %</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {incomeStatement.length > 0 && (
                <>
                  <SectionHeading title="Resultat" />
                  {incomeStatement.map((line) => renderLine(line))}
                </>
              )}
              {balanceStatement.length > 0 && (
                <>
                  <SectionHeading title="Balanse" />
                  {balanceStatement.map((line) => renderLine(line))}
                </>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
