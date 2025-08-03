import React from 'react';
import { useFirmFinancialStatements } from '@/hooks/useFirmFinancialStatements';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileText, Download, Settings, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClientFinancialStatementGeneratorProps {
  clientId: string;
  selectedVersion?: string;
  onNavigateToMapping?: () => void;
}

const ClientFinancialStatementGenerator: React.FC<ClientFinancialStatementGeneratorProps> = ({
  clientId,
  selectedVersion,
  onNavigateToMapping
}) => {
  const { financialStatement, mappingStats, periodInfo, isLoading } = useFirmFinancialStatements(clientId, selectedVersion);

  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('no-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const shouldShowLine = (line: any): boolean => {
    // Always show total lines even if zero
    if (line.is_total_line) return true;
    
    // Show if current amount or previous amount is not zero
    const currentAmount = line.amount || 0;
    const previousAmount = line.previous_amount || 0;
    
    return currentAmount !== 0 || previousAmount !== 0;
  };

  const renderFinancialStatementLine = (line: any, level: number = 0): React.ReactNode => {
    // Don't show lines with zero values (except totals)
    if (!shouldShowLine(line)) {
      return null;
    }

    const indentStyle = { paddingLeft: `${level * 24}px` };
    const currentAmount = line.amount || 0;
    const previousAmount = line.previous_amount || 0;
    
    return (
      <React.Fragment key={line.id}>
        <div 
          className={cn(
            "grid grid-cols-3 gap-4 py-2 border-b border-border/40",
            line.is_total_line && "font-semibold bg-muted/30 border-b-2",
            level === 0 && "bg-muted/20 font-medium"
          )}
          style={indentStyle}
        >
          <div className="flex items-center gap-2 col-span-1">
            <span className="text-xs text-muted-foreground font-mono">
              {line.standard_number}
            </span>
            <span className={cn(
              "text-sm",
              line.is_total_line && "font-semibold",
              level === 0 && "font-medium"
            )}>
              {line.standard_name}
            </span>
            {line.line_type === 'calculation' && (
              <Badge variant="secondary" className="text-xs">
                Beregnet
              </Badge>
            )}
          </div>
          
          <div className={cn(
            "text-sm tabular-nums font-mono text-right",
            line.is_total_line && "font-semibold",
            currentAmount < 0 && "text-destructive"
          )}>
            {currentAmount < 0 ? `(${formatAmount(Math.abs(currentAmount))})` : formatAmount(currentAmount)}
          </div>
          
          <div className={cn(
            "text-sm tabular-nums font-mono text-right text-muted-foreground",
            line.is_total_line && "font-semibold",
            previousAmount < 0 && "text-destructive"
          )}>
            {previousAmount < 0 ? `(${formatAmount(Math.abs(previousAmount))})` : formatAmount(previousAmount)}
          </div>
        </div>
        
        {line.children && line.children.map((child: any) => 
          renderFinancialStatementLine(child, level + 1)
        )}
      </React.Fragment>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Regnskapsoppstilling
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground">Genererer regnskapsoppstilling...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!financialStatement) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Regnskapsoppstilling
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-4">
            <Info className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <p className="font-medium">Kan ikke generere regnskapsoppstilling</p>
              <p className="text-sm text-muted-foreground">
                Mangler nødvendige data eller mapping mellom kontoer og standardkontoer
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={onNavigateToMapping}>
              <Settings className="h-4 w-4 mr-2" />
              Gå til Mapping
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const mappingPercentage = mappingStats.totalAccounts > 0 
    ? Math.round((mappingStats.mappedAccounts / mappingStats.totalAccounts) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Mapping Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Mapping Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span>Mapping-kvalitet</span>
            <span className="font-medium">{mappingPercentage}%</span>
          </div>
          <Progress value={mappingPercentage} className="h-2" />
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div className="text-center">
              <div className="font-semibold text-lg">{mappingStats.totalAccounts}</div>
              <div className="text-muted-foreground">Totalt</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg text-green-600">{mappingStats.mappedAccounts}</div>
              <div className="text-muted-foreground">Mappet</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg text-amber-600">{mappingStats.unmappedAccounts}</div>
              <div className="text-muted-foreground">Umappet</div>
            </div>
          </div>
          {mappingStats.unmappedAccounts > 0 && (
            <div className="pt-2">
              <Button variant="outline" size="sm" className="w-full" onClick={onNavigateToMapping}>
                <Settings className="h-4 w-4 mr-2" />
                Forbedre Mapping
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Financial Statement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Regnskapsoppstilling
              {periodInfo && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({periodInfo.currentYear})
                </span>
              )}
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Eksporter
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Table Header */}
          <div className="grid grid-cols-3 gap-4 py-3 border-b-2 border-border font-semibold text-sm mb-2">
            <div>Konto</div>
            <div className="text-right">
              {periodInfo ? periodInfo.currentYear : 'Dette år'}
            </div>
            <div className="text-right text-muted-foreground">
              {periodInfo ? periodInfo.previousYear : 'Forrige år'}
            </div>
          </div>
          
          <div className="space-y-1">
            {financialStatement.map(line => renderFinancialStatementLine(line))}
          </div>
          
          {mappingPercentage < 90 && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800">Ikke komplett mapping</p>
                  <p className="text-amber-700">
                    {mappingStats.unmappedAccounts} kontoer er ikke mappet til standardkontoer. 
                    Dette kan påvirke nøyaktigheten av regnskapsoppstillingen.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientFinancialStatementGenerator;