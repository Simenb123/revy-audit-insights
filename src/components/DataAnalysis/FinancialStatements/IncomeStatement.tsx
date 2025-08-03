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

  // Group lines by sections based on display_order and line types
  const groupLinesBySection = (lines: any[]) => {
    // Sort all lines by display_order first
    const sortedLines = [...lines].sort((a, b) => {
      const orderA = a.display_order || parseInt(a.standard_number) || 0;
      const orderB = b.display_order || parseInt(b.standard_number) || 0;
      return orderA - orderB;
    });

    const sections = {
      revenue: { 
        title: "DRIFTSINNTEKTER", 
        lines: [] as any[], 
        detailRange: [10, 18], 
        subtotalNumbers: ['19'] 
      },
      expenses: { 
        title: "DRIFTSKOSTNADER", 
        lines: [] as any[], 
        detailRange: [20, 78], 
        subtotalNumbers: ['79'] 
      },
      operatingResult: { 
        title: "DRIFTSRESULTAT", 
        lines: [] as any[], 
        detailRange: [80, 89], 
        subtotalNumbers: ['80'] 
      },
      financial: { 
        title: "FINANSPOSTER", 
        lines: [] as any[], 
        detailRange: [90, 154], 
        subtotalNumbers: ['155'] 
      },
      resultBeforeTax: { 
        title: "RESULTAT FØR SKATT", 
        lines: [] as any[], 
        detailRange: [160, 164], 
        subtotalNumbers: ['160'] 
      },
      tax: { 
        title: "SKATTEKOSTNAD", 
        lines: [] as any[], 
        detailRange: [165, 179], 
        subtotalNumbers: [] as string[]
      },
      annualResult: { 
        title: "ÅRSRESULTAT", 
        lines: [] as any[], 
        detailRange: [280, 299], 
        subtotalNumbers: ['280'] 
      }
    };

    sortedLines.forEach(line => {
      const accountNum = parseInt(line.standard_number);
      if (isNaN(accountNum)) return;

      for (const [key, section] of Object.entries(sections)) {
        const inDetailRange = accountNum >= section.detailRange[0] && accountNum <= section.detailRange[1];
        const isSubtotal = section.subtotalNumbers.includes(line.standard_number);
        
        if (inDetailRange || isSubtotal) {
          section.lines.push(line);
          break;
        }
      }
    });

    return sections;
  };

  const renderSection = (sectionTitle: string, lines: any[], isKeyResult = false) => {
    if (lines.length === 0) return null;

    // Sort lines by display_order or standard_number
    const sortedLines = [...lines].sort((a, b) => {
      const orderA = a.display_order || parseInt(a.standard_number) || 0;
      const orderB = b.display_order || parseInt(b.standard_number) || 0;
      return orderA - orderB;
    });

    // Separate detail lines and sum lines
    const detailLines = sortedLines.filter(line => !line.is_total_line && line.line_type !== 'calculation');
    const sumLines = sortedLines.filter(line => line.is_total_line || line.line_type === 'calculation');

    return (
      <div className="mb-6">
        {/* Section header */}
        <div className={cn(
          "py-3 px-4 font-bold text-base border-b-2 mb-3",
          isKeyResult 
            ? "bg-gradient-to-r from-emerald-500/15 to-emerald-500/8 border-emerald-500/30 text-emerald-700"
            : "bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 text-primary"
        )}>
          {sectionTitle}
        </div>

        {/* Detail lines first */}
        {detailLines.map(line => renderIncomeLine(line, 0, false))}
        
        {/* Sum lines after detail lines */}
        {sumLines.map(line => renderIncomeLine(line, 0, true, isKeyResult))}
      </div>
    );
  };

  const renderIncomeLine = (line: any, level: number = 0, isSum = false, isKeyResult = false): React.ReactNode => {
    if (!shouldShowLine(line)) {
      return null;
    }

    const currentAmount = line.amount || 0;
    const previousAmount = line.previous_amount || 0;
    const isSubTotal = isSum && !isKeyResult;
    const isMainResult = isSum && isKeyResult;
    
    return (
      <React.Fragment key={line.id}>
        <div 
          className={cn(
            "group grid grid-cols-3 gap-6 py-2.5 px-4 transition-all duration-200",
            "hover:bg-muted/40 border-b border-border/10",
            // Detail line styling
            !isSum && "text-sm",
            // Sum line styling
            isSubTotal && "bg-muted/30 font-semibold border-b-2 border-border/40 text-base mt-2",
            // Key result styling
            isMainResult && "bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 font-bold text-lg text-emerald-700 border-b-4 border-emerald-500/30 mt-3 mb-2",
            // Indentation for detail lines
            !isSum && level === 0 && "ml-4 border-l-2 border-muted-foreground/15 pl-4",
            !isSum && level >= 1 && "ml-8 border-l border-muted-foreground/10 pl-4"
          )}
        >
          <div className="flex items-center gap-3 col-span-1 min-w-0">
            <span className={cn(
              "text-xs font-mono shrink-0 px-2 py-1 rounded",
              isMainResult ? "bg-emerald-500/15 text-emerald-700 font-bold" :
              isSubTotal ? "bg-muted/70 text-foreground font-semibold" :
              "bg-muted/50 text-muted-foreground"
            )}>
              {line.standard_number}
            </span>
            <span className={cn(
              "truncate",
              isMainResult && "font-bold text-lg text-emerald-700",
              isSubTotal && "font-semibold text-base",
              !isSum && "text-foreground"
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
            isMainResult && "font-bold text-lg text-emerald-700",
            isSubTotal && "font-semibold text-base",
            !isSum && "text-sm",
            currentAmount < 0 && "text-destructive font-semibold",
            currentAmount === 0 && !isMainResult && !isSubTotal && "text-muted-foreground/60"
          )}>
            {currentAmount < 0 ? `(${formatCurrency(Math.abs(currentAmount))})` : formatCurrency(currentAmount)}
          </div>
          
          <div className={cn(
            "tabular-nums font-mono text-right text-muted-foreground transition-colors",
            isMainResult && "font-bold text-base text-emerald-600",
            isSubTotal && "font-semibold",
            !isSum && "text-sm",
            previousAmount < 0 && "text-destructive/70 font-semibold",
            previousAmount === 0 && !isMainResult && !isSubTotal && "text-muted-foreground/40"
          )}>
            {previousAmount < 0 ? `(${formatCurrency(Math.abs(previousAmount))})` : formatCurrency(previousAmount)}
          </div>
        </div>
        
        {line.children && line.children.map((child: any) => 
          renderIncomeLine(child, level + 1, false)
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

  const sections = groupLinesBySection(incomeStatementData);

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
      <div className="bg-background">
        {/* Revenue section */}
        {renderSection(sections.revenue.title, sections.revenue.lines)}
        
        {/* Expenses section */}
        {renderSection(sections.expenses.title, sections.expenses.lines)}
        
        {/* Operating result - key result */}
        {renderSection(sections.operatingResult.title, sections.operatingResult.lines, true)}
        
        {/* Financial items */}
        {renderSection(sections.financial.title, sections.financial.lines)}
        
        {/* Result before tax - key result */}
        {renderSection(sections.resultBeforeTax.title, sections.resultBeforeTax.lines, true)}
        
        {/* Tax expense */}
        {renderSection(sections.tax.title, sections.tax.lines)}
        
        {/* Annual result - key result */}
        {renderSection(sections.annualResult.title, sections.annualResult.lines, true)}
      </div>
    </div>
  );
};

export default IncomeStatement;