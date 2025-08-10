import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/lib/formatters';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useSimpleIncomeStatement } from '@/hooks/useSimpleIncomeStatement';
import { useTrialBalanceMappings } from '@/hooks/useTrialBalanceMappings';
import { useFiscalYear } from '@/contexts/FiscalYearContext';

interface SimpleIncomeStatementProps {
  clientId?: string;
  selectedVersion?: string;
}

const SimpleIncomeStatement: React.FC<SimpleIncomeStatementProps> = ({ 
  clientId,
  selectedVersion 
}) => {
  const navigate = useNavigate();
  const { selectedClientId } = useFiscalYear();
  const actualClientId = clientId || selectedClientId;
  
  console.log('🎬 SimpleIncomeStatement render:', { clientId, actualClientId, selectedVersion });
  
  // Get simplified income statement data
  const { incomeStatementLines, periodInfo, isLoading } = useSimpleIncomeStatement(
    actualClientId || '', 
    selectedVersion
  );
  
  // Get mappings for drill-down
  const { data: mappings = [] } = useTrialBalanceMappings(actualClientId || '');
  
  // Keep all lines to preserve structure (even zero amounts)
  const filteredLines = useMemo(() => {
    return incomeStatementLines;
  }, [incomeStatementLines]);

  console.log('📊 Component data:', { 
    linesCount: incomeStatementLines.length, 
    mappingsCount: mappings.length,
    isLoading 
  });

  // Build mapping lookup for drill-down
  const lineAccountMappings = React.useMemo(() => {
    const result: Record<string, string[]> = {};
    mappings.forEach(mapping => {
      const lineNumber = mapping.statement_line_number;
      if (!result[lineNumber]) {
        result[lineNumber] = [];
      }
      result[lineNumber].push(mapping.account_number);
    });
    console.log('🔗 Line account mappings:', result);
    return result;
  }, [mappings]);

  const handleLineClick = (standardNumber: string) => {
    const accountNumbers = lineAccountMappings[standardNumber];
    console.log('👆 Line clicked:', { standardNumber, accountNumbers, actualClientId });
    
    if (accountNumbers && accountNumbers.length > 0 && actualClientId) {
      const url = `/clients/${actualClientId}/trial-balance?filtered_accounts=${accountNumbers.join(',')}`;
      console.log('🔄 Navigating to:', url);
      navigate(url);
    } else {
      console.log('❌ No navigation - missing data:', { 
        hasAccounts: accountNumbers?.length > 0, 
        hasClientId: !!actualClientId 
      });
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Laster resultatregnskap...</p>
      </div>
    );
  }

  if (incomeStatementLines.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Ingen resultatregnskapsdata tilgjengelig</p>
        <p className="text-xs mt-2">Sjekk at standard accounts er satt opp og at det finnes trial balance data</p>
      </div>
    );
  }

  if (filteredLines.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Alle regnskapslinjer har 0 kr</p>
        <p className="text-xs mt-2">Det finnes ingen transaksjoner for denne perioden</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Debug info */}
      <div className="text-xs text-muted-foreground bg-muted/20 p-2 rounded">
        📊 Debug: {filteredLines.length} av {incomeStatementLines.length} linjer vises, {Object.keys(lineAccountMappings).length} mappings
      </div>

      {/* Header */}
      <div className="text-center py-3 border-b border-border">
        <h2 className="text-xl font-bold text-foreground">RESULTATREGNSKAP (Forenklet)</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Periode: {periodInfo.currentYear} / {periodInfo.previousYear}
        </p>
        {Object.keys(lineAccountMappings).length > 0 && (
          <p className="text-xs text-blue-600 mt-1">
            💡 Klikk på regnskapslinjer for å se tilknyttede kontoer
          </p>
        )}
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-5 gap-4 py-2 px-4 bg-muted/40 border-b border-border font-medium text-xs">
        <div className="text-foreground">Linje</div>
        <div className="text-foreground col-span-2">Beskrivelse</div>
        <div className="text-right text-foreground">{periodInfo.currentYear}</div>
        <div className="text-right text-muted-foreground">{periodInfo.previousYear}</div>
      </div>
      
      {/* Income Statement Lines - Pure chronological order (filtered) */}
      <div className="bg-background">
        {filteredLines.map((line) => {
          const accountNumbers = lineAccountMappings[line.standard_number] || [];
          const hasAccounts = accountNumbers.length > 0;
          const isSubtotal = line.line_type === 'subtotal';
          const isCalculation = line.line_type === 'calculation';
          
          const lineContent = (
            <div 
              className={cn(
                "group grid grid-cols-5 gap-4 py-1.5 px-4 transition-all duration-200",
                "border-b border-border/5",
                // Styling based on line type
                isSubtotal && "bg-muted/20 font-medium border-b border-border/30",
                isCalculation && "bg-blue-50 font-bold border-b-2 border-blue-200 mt-1 mb-1",
                !isSubtotal && !isCalculation && "text-sm",
                // Clickable styling
                hasAccounts && "cursor-pointer hover:bg-muted/40 hover:shadow-sm"
              )}
              onClick={hasAccounts ? () => handleLineClick(line.standard_number) : undefined}
            >
              {/* Line number */}
              <div className="flex items-center">
                <span className={cn(
                  "text-xs font-mono px-1 py-0.5 rounded bg-muted/40 text-muted-foreground",
                  isCalculation && "bg-blue-100 text-blue-700 font-medium"
                )}>
                  {line.standard_number}
                </span>
              </div>
              
              {/* Description with account count badge */}
              <div className="flex items-center gap-2 col-span-2 min-w-0">
                <span className={cn(
                  "truncate text-sm",
                  isCalculation && "font-bold text-blue-900",
                  isSubtotal && "font-medium",
                  hasAccounts && "hover:text-primary hover:underline"
                )}>
                  {line.standard_name}
                </span>
                {hasAccounts && (
                  <Badge variant="secondary" className="text-xs">
                    {accountNumbers.length}
                  </Badge>
                )}
              </div>
              
              {/* Current year amount */}
              <div className={cn(
                "tabular-nums font-mono text-right text-sm",
                isCalculation && "font-bold text-blue-900",
                isSubtotal && "font-medium",
                line.amount < 0 && "text-red-600",
                line.amount === 0 && "text-muted-foreground/60"
              )}>
                {line.amount < 0 ? 
                  `(${formatCurrency(Math.abs(line.amount))})` : 
                  formatCurrency(line.amount)
                }
              </div>
              
              {/* Previous year amount */}
              <div className={cn(
                "tabular-nums font-mono text-right text-sm text-muted-foreground",
                isCalculation && "font-bold text-blue-700",
                line.previous_amount < 0 && "text-red-500",
                line.previous_amount === 0 && "text-muted-foreground/40"
              )}>
                {line.previous_amount < 0 ? 
                  `(${formatCurrency(Math.abs(line.previous_amount))})` : 
                  formatCurrency(line.previous_amount)
                }
              </div>
            </div>
          );

          return (
            <React.Fragment key={line.id}>
              {hasAccounts ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {lineContent}
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-xs">
                      <div className="space-y-1">
                        <div className="font-medium text-xs">Tilknyttede kontoer:</div>
                        <div className="text-xs text-muted-foreground">
                          {accountNumbers.slice(0, 5).join(', ')}
                          {accountNumbers.length > 5 && ` og ${accountNumbers.length - 5} flere...`}
                        </div>
                        <div className="text-xs text-blue-600 mt-1">Klikk for å se detaljer</div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                lineContent
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default SimpleIncomeStatement;