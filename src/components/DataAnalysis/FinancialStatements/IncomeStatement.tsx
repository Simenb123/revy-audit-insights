import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/lib/formatters';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useTrialBalanceMappings } from '@/hooks/useTrialBalanceMappings';
import { useFiscalYear } from '@/contexts/FiscalYearContext';

interface IncomeStatementProps {
  data: any[];
  currentYear?: number;
  previousYear?: number;
  clientId?: string;
}

const IncomeStatement: React.FC<IncomeStatementProps> = ({ 
  data, 
  currentYear, 
  previousYear,
  clientId 
}) => {
  const navigate = useNavigate();
  const { selectedClientId } = useFiscalYear();
  const actualClientId = clientId || selectedClientId;
  
  // Fetch trial balance mappings for drill-down functionality
  const { data: mappings = [] } = useTrialBalanceMappings(actualClientId || '');
  
  // State for mapped accounts per line
  const [lineAccountMappings, setLineAccountMappings] = useState<Record<string, string[]>>({});
  
  // Build mapping from statement line numbers to account numbers
  useEffect(() => {
    if (mappings.length > 0) {
      const lineToAccounts: Record<string, string[]> = {};
      mappings.forEach(mapping => {
        const lineNumber = mapping.statement_line_number;
        if (!lineToAccounts[lineNumber]) {
          lineToAccounts[lineNumber] = [];
        }
        lineToAccounts[lineNumber].push(mapping.account_number);
      });
      setLineAccountMappings(lineToAccounts);
    }
  }, [mappings]);
  const hasContent = (line: any): boolean => {
    const currentAmount = line.amount || 0;
    const previousAmount = line.previous_amount || 0;
    
    const lineHasContent = currentAmount !== 0 || previousAmount !== 0;
    const childrenHaveContent = line.children && line.children.some((child: any) => hasContent(child));
    
    return lineHasContent || childrenHaveContent;
  };

  const shouldShowLine = (line: any): boolean => {
    if (line.is_total_line) return hasContent(line);
    return hasContent(line);
  };

  // Create pure chronological list - NO section grouping
  const createChronologicalList = (lines: any[]) => {
    console.log('Original lines:', lines.map(l => ({ 
      number: l.standard_number, 
      name: l.standard_name, 
      display_order: l.display_order 
    })));
    
    // Sort ONLY by display_order - no section boundaries
    const sortedLines = [...lines].sort((a, b) => {
      const orderA = a.display_order || parseInt(a.standard_number) || 0;
      const orderB = b.display_order || parseInt(b.standard_number) || 0;
      return orderA - orderB;
    });

    console.log('Sorted lines:', sortedLines.map(l => ({ 
      number: l.standard_number, 
      name: l.standard_name, 
      display_order: l.display_order 
    })));

    // Return simple list - no headers that break chronological order
    return sortedLines.filter(line => line.standard_number !== '280'); // Annual result handled separately
  };

  const renderSectionHeader = (title: string) => (
    <div className="py-1.5 px-4 font-medium text-xs text-muted-foreground uppercase tracking-wide border-b border-border/20 mb-1">
      {title}
    </div>
  );

  const handleLineClick = (standardNumber: string) => {
    const accountNumbers = lineAccountMappings[standardNumber];
    console.log('Line clicked:', { standardNumber, accountNumbers, actualClientId });
    console.log('All lineAccountMappings:', lineAccountMappings);
    
    if (accountNumbers && accountNumbers.length > 0 && actualClientId) {
      const url = `/clients/${actualClientId}/trial-balance?filtered_accounts=${accountNumbers.join(',')}`;
      console.log('Navigating to:', url);
      navigate(url);
    } else {
      console.log('No navigation - missing data:', { 
        hasAccounts: accountNumbers?.length > 0, 
        hasClientId: !!actualClientId 
      });
    }
  };

  const renderIncomeLine = (line: any, level: number = 0, isSum = false, isKeyResult = false): React.ReactNode => {
    if (!shouldShowLine(line)) {
      return null;
    }

    const currentAmount = line.amount || 0;
    const previousAmount = line.previous_amount || 0;
    const isSubTotal = isSum && !isKeyResult;
    const isMainResult = isSum && isKeyResult;
    const accountNumbers = lineAccountMappings[line.standard_number] || [];
    const hasAccounts = accountNumbers.length > 0;
    
    const lineContent = (
      <div 
        className={cn(
          "group grid grid-cols-4 gap-4 py-1.5 px-4 transition-all duration-200",
          "border-b border-border/5",
          // Detail line styling - compact
          !isSum && "text-sm",
          // Subtotal line styling - subtle
          isSubTotal && !isMainResult && "bg-muted/20 font-medium border-b border-border/30 text-sm",
          // Main result styling - blue background like template
          isMainResult && "bg-blue-50 font-bold text-sm border-b-2 border-blue-200 mt-1 mb-1",
          // Minimal indentation
          !isSum && level === 0 && "pl-6",
          !isSum && level >= 1 && "pl-8",
          // Clickable styling when has accounts
          hasAccounts && "cursor-pointer hover:bg-muted/40 hover:shadow-sm"
        )}
        onClick={hasAccounts ? () => handleLineClick(line.standard_number) : undefined}
      >
        <div className="flex items-center gap-2 col-span-1 min-w-0">
          <span className={cn(
            "text-xs font-mono shrink-0 px-1 py-0.5 rounded bg-muted/40 text-muted-foreground",
            isMainResult && "bg-blue-100 text-blue-700 font-medium"
          )}>
            {line.standard_number}
          </span>
          <span className={cn(
            "truncate text-sm",
            isMainResult && "font-bold text-blue-900",
            isSubTotal && "font-medium",
            !isSum && "text-foreground",
            hasAccounts && "hover:text-primary hover:underline"
          )}>
            {line.standard_name}
          </span>
          {hasAccounts && (
            <Badge variant="secondary" className="text-xs ml-1">
              {accountNumbers.length}
            </Badge>
          )}
        </div>
        
        {/* Note column */}
        <div className="text-xs text-muted-foreground text-center">
          {/* Note references would go here */}
        </div>
        
        <div className={cn(
          "tabular-nums font-mono text-right text-sm transition-colors",
          isMainResult && "font-bold text-blue-900",
          isSubTotal && "font-medium",
          currentAmount < 0 && "text-red-600",
          currentAmount === 0 && "text-muted-foreground/60"
        )}>
          {currentAmount < 0 ? `(${formatCurrency(Math.abs(currentAmount))})` : formatCurrency(currentAmount)}
        </div>
        
        <div className={cn(
          "tabular-nums font-mono text-right text-sm text-muted-foreground transition-colors",
          isMainResult && "font-bold text-blue-700",
          isSubTotal && "font-medium",
          previousAmount < 0 && "text-red-500",
          previousAmount === 0 && "text-muted-foreground/40"
        )}>
          {previousAmount < 0 ? `(${formatCurrency(Math.abs(previousAmount))})` : formatCurrency(previousAmount)}
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
        
        {line.children && line.children.map((child: any) => 
          renderIncomeLine(child, level + 1, false)
        )}
      </React.Fragment>
    );
  };

  // Use data directly from hook (already filtered and sorted by display_order)
  const chronologicalList = createChronologicalList(data);

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Ingen resultatregnskapsdata tilgjengelig</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header - simplified */}
      <div className="text-center py-3 border-b border-border">
        <h2 className="text-xl font-bold text-foreground">RESULTATREGNSKAP</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Periode: {currentYear && previousYear ? `${currentYear} / ${previousYear}` : 'Inneværende år'}
        </p>
        {Object.keys(lineAccountMappings).length > 0 && (
          <p className="text-xs text-blue-600 mt-1">
            💡 Klikk på regnskapslinjer for å se tilknyttede kontoer
          </p>
        )}
      </div>

      {/* Table Header - compact with Note column */}
      <div className="grid grid-cols-4 gap-4 py-2 px-4 bg-muted/40 border-b border-border font-medium text-xs sticky top-0 z-10">
        <div className="text-foreground">Resultatposter</div>
        <div className="text-center text-foreground">Note</div>
        <div className="text-right text-foreground">
          {currentYear || 'Dette år'}
        </div>
        <div className="text-right text-muted-foreground">
          {previousYear || 'Forrige år'}
        </div>
      </div>
      
      {/* Content - pure chronological order by display_order */}
      <div className="bg-background">
        {chronologicalList.map((line, index) => {
          // Use line_type from database for styling - no hardcoded arrays
          const isSubtotal = line.line_type === 'subtotal';
          const isCalculation = line.line_type === 'calculation';
          
          return renderIncomeLine(line, 0, isSubtotal || isCalculation, isCalculation);
        })}
        
        {/* Annual result as single calculation line - no duplication */}
        {(() => {
          const annualResultLine = data.find(line => line.standard_number === '280');
          return annualResultLine && shouldShowLine(annualResultLine) ? 
            renderIncomeLine(annualResultLine, 0, true, true) : null;
        })()}
      </div>
    </div>
  );
};

export default IncomeStatement;