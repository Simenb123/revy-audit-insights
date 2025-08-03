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

  // Group lines by sections following template structure
  const groupLinesBySection = (lines: any[]) => {
    const sections = {
      operating: { 
        title: "DRIFTSINNTEKTER OG DRIFTSKOSTNADER", 
        lines: [] as any[], 
        ranges: [[10, 18], [20, 78]], 
        subtotalNumbers: ['19', '79'],
        resultNumbers: ['80'] // Driftsresultat
      },
      financial: { 
        title: "FINANSINNTEKTER OG FINANSKOSTNADER", 
        lines: [] as any[], 
        ranges: [[90, 154]], 
        subtotalNumbers: ['155'],
        resultNumbers: ['160'] // Resultat før skatt
      },
      tax: { 
        title: "SKATTEKOSTNAD", 
        lines: [] as any[], 
        ranges: [[165, 179]], 
        subtotalNumbers: [] as string[],
        resultNumbers: [] as string[]
      },
      transfers: { 
        title: "OVERFØRINGER", 
        lines: [] as any[], 
        ranges: [[350, 399]], 
        subtotalNumbers: [] as string[],
        resultNumbers: [] as string[]
      }
    };

    // Sort all lines by display_order first
    const sortedLines = [...lines].sort((a, b) => {
      const orderA = a.display_order || parseInt(a.standard_number) || 0;
      const orderB = b.display_order || parseInt(b.standard_number) || 0;
      return orderA - orderB;
    });

    sortedLines.forEach(line => {
      const accountNum = parseInt(line.standard_number);
      if (isNaN(accountNum)) return;

      // Skip annual result 280 - it will be handled as calculation
      if (line.standard_number === '280') return;

      for (const [key, section] of Object.entries(sections)) {
        const inDetailRange = section.ranges.some(([start, end]) => 
          accountNum >= start && accountNum <= end
        );
        const isSubtotal = section.subtotalNumbers.includes(line.standard_number);
        const isResult = section.resultNumbers.includes(line.standard_number);
        
        if (inDetailRange || isSubtotal || isResult) {
          section.lines.push(line);
          break;
        }
      }
    });

    return sections;
  };

  const renderSection = (sectionTitle: string, lines: any[], section: any) => {
    if (lines.length === 0) return null;

    // Sort lines by display_order or standard_number
    const sortedLines = [...lines].sort((a, b) => {
      const orderA = a.display_order || parseInt(a.standard_number) || 0;
      const orderB = b.display_order || parseInt(b.standard_number) || 0;
      return orderA - orderB;
    });

    // Render all lines in chronological order based on display_order
    return (
      <div className="mb-3">
        {/* Section header - compact design from patch 2 */}
        {sortedLines.length > 0 && (
          <div className="py-1.5 px-4 font-medium text-xs text-muted-foreground uppercase tracking-wide border-b border-border/20 mb-1">
            {sectionTitle}
          </div>
        )}

        {/* Render all lines in chronological order */}
        {sortedLines.map(line => {
          const isSubtotal = section.subtotalNumbers.includes(line.standard_number);
          const isResult = section.resultNumbers.includes(line.standard_number) || line.line_type === 'calculation';
          
          return renderIncomeLine(line, 0, isSubtotal || isResult, isResult);
        })}
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
            "group grid grid-cols-4 gap-4 py-1.5 px-4 transition-all duration-200",
            "hover:bg-muted/30 border-b border-border/5",
            // Detail line styling - compact
            !isSum && "text-sm",
            // Subtotal line styling - subtle
            isSubTotal && !isMainResult && "bg-muted/20 font-medium border-b border-border/30 text-sm",
            // Main result styling - blue background like template
            isMainResult && "bg-blue-50 font-bold text-sm border-b-2 border-blue-200 mt-1 mb-1",
            // Minimal indentation
            !isSum && level === 0 && "pl-6",
            !isSum && level >= 1 && "pl-8"
          )}
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
              !isSum && "text-foreground"
            )}>
              {line.standard_name}
            </span>
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
      {/* Header - simplified */}
      <div className="text-center py-3 border-b border-border">
        <h2 className="text-xl font-bold text-foreground">RESULTATREGNSKAP</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Periode: {currentYear && previousYear ? `${currentYear} / ${previousYear}` : 'Inneværende år'}
        </p>
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
      
      {/* Content - compact layout */}
      <div className="bg-background">
        {/* Operating income and expenses */}
        {renderSection(sections.operating.title, sections.operating.lines, sections.operating)}
        
        {/* Financial income and expenses */}
        {renderSection(sections.financial.title, sections.financial.lines, sections.financial)}
        
        {/* Tax expense */}
        {renderSection(sections.tax.title, sections.tax.lines, sections.tax)}
        
        {/* Annual result as single calculation line - no duplication */}
        {(() => {
          const annualResultLine = incomeStatementData.find(line => line.standard_number === '280');
          return annualResultLine && shouldShowLine(annualResultLine) ? 
            renderIncomeLine(annualResultLine, 0, true, true) : null;
        })()}
        
        {/* Transfers (if any) */}
        {renderSection(sections.transfers.title, sections.transfers.lines, sections.transfers)}
      </div>
    </div>
  );
};

export default IncomeStatement;