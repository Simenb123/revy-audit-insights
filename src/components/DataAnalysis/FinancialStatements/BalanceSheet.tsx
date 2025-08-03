import React from 'react';
import { formatCurrency } from '@/lib/formatters';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface BalanceSheetProps {
  data: any[];
  currentYear?: number;
  previousYear?: number;
}

const BalanceSheet: React.FC<BalanceSheetProps> = ({ 
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

  const renderBalanceLine = (line: any, level: number = 0, section: 'assets' | 'liabilities-equity' = 'assets'): React.ReactNode => {
    if (!shouldShowLine(line)) {
      return null;
    }

    const currentAmount = line.amount || 0;
    const previousAmount = line.previous_amount || 0;
    const isMainSection = level === 0;
    const isSubTotal = line.is_total_line && level > 0;
    const isGrandTotal = line.is_total_line && level === 0;
    
    // Color scheme based on section
    const sectionColors = {
      assets: {
        main: 'from-blue-500/8 to-blue-500/4 border-blue-500/20 text-blue-700',
        total: 'from-blue-500/10 to-blue-500/5 border-blue-500/30 text-blue-700',
        badge: 'bg-blue-500/15 text-blue-700'
      },
      'liabilities-equity': {
        main: 'from-violet-500/8 to-violet-500/4 border-violet-500/20 text-violet-700',
        total: 'from-violet-500/10 to-violet-500/5 border-violet-500/30 text-violet-700',
        badge: 'bg-violet-500/15 text-violet-700'
      }
    };
    
    const colors = sectionColors[section];
    
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
            isMainSection && `bg-gradient-to-r ${colors.main} font-semibold text-lg border-b-2`,
            isSubTotal && "bg-muted/30 font-semibold border-b-2 border-border/40 text-base",
            isGrandTotal && `bg-gradient-to-r ${colors.total} font-bold text-lg border-b-4`,
            // Indentation
            level === 1 && `ml-4 border-l-2 ${section === 'assets' ? 'border-blue-500/20' : 'border-violet-500/20'} pl-4`,
            level === 2 && "ml-8 border-l border-muted-foreground/15 pl-4",
            level >= 3 && "ml-12 border-l border-muted-foreground/10 pl-4"
          )}
        >
          <div className="flex items-center gap-3 col-span-1 min-w-0">
            <span className={cn(
              "text-xs font-mono shrink-0 px-2 py-1 rounded",
              isMainSection ? colors.badge + " font-semibold" : "bg-muted/50 text-muted-foreground",
              isGrandTotal && colors.badge + " font-bold"
            )}>
              {line.standard_number}
            </span>
            <span className={cn(
              "truncate",
              isMainSection && `font-bold text-lg ${colors.main.includes('blue') ? 'text-blue-700' : 'text-violet-700'}`,
              isSubTotal && "font-semibold text-base",
              isGrandTotal && `font-bold text-lg ${colors.main.includes('blue') ? 'text-blue-700' : 'text-violet-700'}`,
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
            isGrandTotal && `font-bold text-lg ${colors.main.includes('blue') ? 'text-blue-700' : 'text-violet-700'}`,
            currentAmount < 0 && "text-destructive font-semibold",
            currentAmount === 0 && !isGrandTotal && !isMainSection && "text-muted-foreground/60"
          )}>
            {currentAmount < 0 ? `(${formatCurrency(Math.abs(currentAmount))})` : formatCurrency(currentAmount)}
          </div>
          
          <div className={cn(
            "tabular-nums font-mono text-right text-muted-foreground transition-colors",
            isMainSection && "font-bold text-base",
            isSubTotal && "font-semibold",
            isGrandTotal && `font-bold text-base ${colors.main.includes('blue') ? 'text-blue-600' : 'text-violet-600'}`,
            previousAmount < 0 && "text-destructive/70 font-semibold",
            previousAmount === 0 && !isGrandTotal && !isMainSection && "text-muted-foreground/40"
          )}>
            {previousAmount < 0 ? `(${formatCurrency(Math.abs(previousAmount))})` : formatCurrency(previousAmount)}
          </div>
        </div>
        
        {line.children && line.children.map((child: any) => 
          renderBalanceLine(child, level + 1, section)
        )}
      </React.Fragment>
    );
  };

  // Separate assets from liabilities and equity
  const assets = data.filter(line => line.account_type === 'eiendeler' || line.account_type === 'asset');
  const liabilitiesAndEquity = data.filter(line => 
    line.account_type === 'gjeld' || 
    line.account_type === 'egenkapital' || 
    line.account_type === 'liability' || 
    line.account_type === 'equity'
  );

  if (assets.length === 0 && liabilitiesAndEquity.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Ingen balansedata tilgjengelig</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center py-4 border-b-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <h2 className="text-2xl font-bold text-primary">BALANSE</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Per {currentYear && previousYear ? `31.12.${currentYear} / 31.12.${previousYear}` : '31.12 inneværende år'}
        </p>
      </div>

      {/* Assets Section */}
      {assets.length > 0 && (
        <div>
          <div className="mb-4">
            <h3 className="text-xl font-bold text-blue-700 bg-gradient-to-r from-blue-500/10 to-blue-500/5 py-2 px-4 border-l-4 border-blue-500">
              EIENDELER
            </h3>
          </div>
          
          {/* Table Header */}
          <div className="grid grid-cols-3 gap-6 py-3 px-4 bg-gradient-to-r from-blue-50/80 to-blue-50/50 border-b-2 border-blue-200 font-bold text-sm">
            <div className="text-blue-800">Eiendeler</div>
            <div className="text-right text-blue-800">
              {currentYear || 'Dette år'}
            </div>
            <div className="text-right text-blue-700/70">
              {previousYear || 'Forrige år'}
            </div>
          </div>
          
          <div className="bg-background">
            {assets.map(line => renderBalanceLine(line, 0, 'assets'))}
          </div>
        </div>
      )}

      {/* Liabilities and Equity Section */}
      {liabilitiesAndEquity.length > 0 && (
        <div>
          <div className="mb-4">
            <h3 className="text-xl font-bold text-violet-700 bg-gradient-to-r from-violet-500/10 to-violet-500/5 py-2 px-4 border-l-4 border-violet-500">
              GJELD OG EGENKAPITAL
            </h3>
          </div>
          
          {/* Table Header */}
          <div className="grid grid-cols-3 gap-6 py-3 px-4 bg-gradient-to-r from-violet-50/80 to-violet-50/50 border-b-2 border-violet-200 font-bold text-sm">
            <div className="text-violet-800">Gjeld og egenkapital</div>
            <div className="text-right text-violet-800">
              {currentYear || 'Dette år'}
            </div>
            <div className="text-right text-violet-700/70">
              {previousYear || 'Forrige år'}
            </div>
          </div>
          
          <div className="bg-background">
            {liabilitiesAndEquity.map(line => renderBalanceLine(line, 0, 'liabilities-equity'))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BalanceSheet;