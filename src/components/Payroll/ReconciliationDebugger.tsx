import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Bug, 
  Calculator, 
  Database,
  AlertCircle,
  CheckCircle,
  Info,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DebugStep {
  step: number;
  description: string;
  calculation?: string;
  value: number;
  accounts?: Array<{
    account: string;
    name: string;
    amount: number;
    operation: '+' | '-' | '=';
  }>;
  rules?: Array<{
    id: string;
    pattern: string;
    matched: boolean;
  }>;
  status: 'success' | 'warning' | 'error' | 'info';
}

interface ReconciliationDebugProps {
  code: string;
  description: string;
  debugSteps: DebugStep[];
  finalResult: {
    A: number;
    B: number;
    C: number;
    D: number;
    E: number;
    amelding: number;
    difference: number;
  };
}

const ReconciliationDebugger: React.FC<ReconciliationDebugProps> = ({
  code,
  description,
  debugSteps,
  finalResult
}) => {
  const getStepIcon = (status: DebugStep['status']) => {
    switch (status) {
      case 'success': return CheckCircle;
      case 'warning': return AlertCircle;
      case 'error': return AlertCircle;
      case 'info': return Info;
      default: return Info;
    }
  };

  const getStepColor = (status: DebugStep['status']) => {
    switch (status) {
      case 'success': return 'text-success';
      case 'warning': return 'text-warning';
      case 'error': return 'text-destructive';
      case 'info': return 'text-info';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Avstemmingsdetaljer: {code}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Debug Steps */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Beregningssteg
            </h4>
            
            {debugSteps.map((step) => {
              const StepIcon = getStepIcon(step.status);
              return (
                <div key={step.step} className="relative pl-6 pb-4">
                  {/* Step connector line */}
                  {step.step < debugSteps.length && (
                    <div className="absolute left-2 top-6 w-0.5 h-full bg-border" />
                  )}
                  
                  {/* Step indicator */}
                  <div className="absolute left-0 top-0 flex items-center justify-center w-4 h-4 rounded-full border-2 border-background bg-card">
                    <div className={cn("w-2 h-2 rounded-full", 
                      step.status === 'success' && "bg-success",
                      step.status === 'warning' && "bg-warning",
                      step.status === 'error' && "bg-destructive",
                      step.status === 'info' && "bg-info"
                    )} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <StepIcon className={cn("h-4 w-4", getStepColor(step.status))} />
                      <span className="font-medium">Steg {step.step}</span>
                      <Badge variant="outline">{step.value.toLocaleString('no-NO')} kr</Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                    
                    {step.calculation && (
                      <div className="bg-muted/50 rounded p-2 font-mono text-xs">
                        {step.calculation}
                      </div>
                    )}
                    
                    {/* Show accounts involved */}
                    {step.accounts && step.accounts.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium mb-1 flex items-center gap-1">
                          <Database className="h-3 w-3" />
                          Berørte kontoer:
                        </p>
                        <div className="space-y-1">
                          {step.accounts.map((acc, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs bg-muted/30 rounded p-2">
                              <span className={cn(
                                "w-4 text-center font-bold",
                                acc.operation === '+' && "text-success",
                                acc.operation === '-' && "text-destructive",
                                acc.operation === '=' && "text-info"
                              )}>
                                {acc.operation}
                              </span>
                              <span className="font-mono">{acc.account}</span>
                              <span className="text-muted-foreground truncate flex-1">{acc.name}</span>
                              <span className="font-mono">{acc.amount.toLocaleString('no-NO')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Show rules applied */}
                    {step.rules && step.rules.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium mb-1">Anvendte regler:</p>
                        <div className="space-y-1">
                          {step.rules.map((rule, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs">
                              {rule.matched ? (
                                <CheckCircle className="h-3 w-3 text-success" />
                              ) : (
                                <AlertCircle className="h-3 w-3 text-muted-foreground" />
                              )}
                              <code className="bg-muted/50 px-1 rounded text-xs">{rule.pattern}</code>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          <Separator />
          
          {/* Final Calculation Summary */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Sluttresultat
            </h4>
            
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>A (A07-melding):</span>
                  <span className="font-mono">{finalResult.A.toLocaleString('no-NO')}</span>
                </div>
                <div className="flex justify-between">
                  <span>B (Forrige år):</span>
                  <span className="font-mono">{finalResult.B.toLocaleString('no-NO')}</span>
                </div>
                <div className="flex justify-between">
                  <span>C (Inneværende):</span>
                  <span className="font-mono">{finalResult.C.toLocaleString('no-NO')}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>D (A + B - C):</span>
                  <span className="font-mono font-bold">{finalResult.D.toLocaleString('no-NO')}</span>
                </div>
                <div className="flex justify-between">
                  <span>E (Å melde):</span>
                  <span className="font-mono">{finalResult.E.toLocaleString('no-NO')}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span>Beregnet:</span>
                  <span className="font-mono">{finalResult.D.toLocaleString('no-NO')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Meldt:</span>
                  <span className="font-mono">{finalResult.amelding.toLocaleString('no-NO')}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center font-bold">
                  <span>Avvik:</span>
                  <div className="flex items-center gap-2">
                    {Math.abs(finalResult.difference) <= 0.01 ? (
                      <CheckCircle className="h-4 w-4 text-success" />
                    ) : finalResult.difference > 0 ? (
                      <TrendingUp className="h-4 w-4 text-warning" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-destructive" />
                    )}
                    <span className={cn(
                      "font-mono",
                      Math.abs(finalResult.difference) <= 0.01 && "text-success",
                      Math.abs(finalResult.difference) > 0.01 && Math.abs(finalResult.difference) <= 5 && "text-warning",
                      Math.abs(finalResult.difference) > 5 && "text-destructive"
                    )}>
                      {finalResult.difference.toLocaleString('no-NO', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default ReconciliationDebugger;