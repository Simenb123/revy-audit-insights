import React from 'react';
import { formatCurrency } from '@/lib/formatters';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface IncomeStatementProps {
  data: any[];
  currentYear?: number;
  previousYear?: number;
}

const IncomeStatement: React.FC<IncomeStatementProps> = ({ 
  data, 
  currentYear, 
  previousYear 
}) => {
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

  const renderIncomeLine = (line: any, level: number = 0): React.ReactNode => {
    if (!shouldShowLine(line)) {
      return null;
    }

    const currentAmount = line.amount || 0;
    const previousAmount = line.previous_amount || 0;
    const isMainSection = level === 0;
    const isSubTotal = line.is_total_line && level > 0;
    const isGrandTotal = line.is_total_line && level === 0;
    
    return (
      <React.Fragment key={line.id}>
        {/* Section divider for main sections */}
        {isMainSection && (
          <div className="h-px bg-gradient-to-r from-border via-border/60 to-transparent my-2" />
        )}
        
        <div 
          className={cn(
            "group grid grid-cols-3 gap-6 py-2.5 px-4 transition-all duration-200",
            "hover:bg-muted/40 border-b border-border/20",
            // Styling based on level and type
            isMainSection && "bg-gradient-to-r from-primary/8 to-primary/4 font-semibold text-lg border-b-2 border-primary/20",
            isSubTotal && "bg-muted/30 font-semibold border-b-2 border-border/40 text-base",
            isGrandTotal && "bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 font-bold text-lg text-emerald-700 border-b-4 border-emerald-500/30",
            // Indentation
            level === 1 && "ml-4 border-l-2 border-primary/20 pl-4",
            level === 2 && "ml-8 border-l border-muted-foreground/15 pl-4",
            level >= 3 && "ml-12 border-l border-muted-foreground/10 pl-4"
          )}
        >
          <div className="flex items-center gap-3 col-span-1 min-w-0">
            <span className={cn(
              "text-xs font-mono shrink-0 px-2 py-1 rounded",
              isMainSection ? "bg-primary/10 text-primary font-semibold" : "bg-muted/50 text-muted-foreground",
              isGrandTotal && "bg-emerald-500/15 text-emerald-700 font-bold"
            )}>
              {line.standard_number}
            </span>
            <span className={cn(
              "truncate",
              isMainSection && "font-bold text-lg text-foreground",
              isSubTotal && "font-semibold text-base",
              isGrandTotal && "font-bold text-lg text-emerald-700",
              level >= 2 && "text-muted-foreground text-sm"
            )}>
              {line.standard_name}
            </span>
            {line.line_type === 'calculation' && (
              <Badge variant="secondary" className="text-xs shrink-0">
                Beregnet
              </Badge>
            )}
          </div>
          
          <div className={cn(
            "tabular-nums font-mono text-right transition-colors",
            isMainSection && "font-bold text-lg",
            isSubTotal && "font-semibold text-base",
            isGrandTotal && "font-bold text-lg text-emerald-700",
            currentAmount < 0 && "text-destructive font-semibold",
            currentAmount === 0 && !isGrandTotal && !isMainSection && "text-muted-foreground/60"
          )}>
            {currentAmount < 0 ? `(${formatCurrency(Math.abs(currentAmount))})` : formatCurrency(currentAmount)}
          </div>
          
          <div className={cn(
            "tabular-nums font-mono text-right text-muted-foreground transition-colors",
            isMainSection && "font-bold text-base",
            isSubTotal && "font-semibold",
            isGrandTotal && "font-bold text-base text-emerald-600",
            previousAmount < 0 && "text-destructive/70 font-semibold",
            previousAmount === 0 && !isGrandTotal && !isMainSection && "text-muted-foreground/40"
          )}>
            {previousAmount < 0 ? `(${formatCurrency(Math.abs(previousAmount))})` : formatCurrency(previousAmount)}
          </div>
        </div>
        
        {line.children && line.children.map((child: any) => 
          renderIncomeLine(child, level + 1)
        )}
      </React.Fragment>
    );
  };

  // Filter data to only include 'resultat' account types
  const incomeStatementData = data.filter(line => 
    line.account_type === 'resultat' || 
    line.account_type === 'revenue' || 
    line.account_type === 'expense'
  );

  if (incomeStatementData.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Ingen resultatregnskapsdata tilgjengelig</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center py-4 border-b-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <h2 className="text-2xl font-bold text-primary">RESULTATREGNSKAP</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Periode: {currentYear && previousYear ? `${currentYear} / ${previousYear}` : 'Inneværende år'}
        </p>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-3 gap-6 py-3 px-4 bg-gradient-to-r from-muted/80 to-muted/50 border-b-2 border-border font-bold text-sm sticky top-0 z-10">
        <div className="text-foreground">Resultatposter</div>
        <div className="text-right text-foreground">
          {currentYear || 'Dette år'}
        </div>
        <div className="text-right text-muted-foreground">
          {previousYear || 'Forrige år'}
        </div>
      </div>
      
      {/* Content */}
      <div className="max-h-[500px] overflow-y-auto bg-background">
        {incomeStatementData.map(line => renderIncomeLine(line))}
      </div>
    </div>
  );
};

export default IncomeStatement;