import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Bug, 
  ChevronDown, 
  ChevronRight, 
  Play, 
  Clock, 
  Calculator,
  AlertTriangle,
  CheckCircle,
  Eye,
  Layers
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatNumeric } from '@/utils/kpiFormat';
import { formatCurrency } from '@/lib/formatters';

interface DebugStep {
  step: number;
  operation: string;
  description: string;
  input: any;
  output: any;
  success: boolean;
  error?: string;
  metadata?: any;
}

interface FormulaDebuggerProps {
  formulaExpression: any;
  debugData?: {
    steps: DebugStep[];
    finalResult: number;
    totalTime: number;
    accountValues: Record<string, number>;
    variableValues: Record<string, any>;
  };
  onDebugModeChange?: (enabled: boolean) => void;
  isDebugging?: boolean;
}

export function FormulaDebugger({ 
  formulaExpression, 
  debugData,
  onDebugModeChange,
  isDebugging = false
}: FormulaDebuggerProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState('steps');

  const toggleStep = (stepNumber: number) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepNumber)) {
      newExpanded.delete(stepNumber);
    } else {
      newExpanded.add(stepNumber);
    }
    setExpandedSteps(newExpanded);
  };

  const expandAll = () => {
    if (debugData?.steps) {
      setExpandedSteps(new Set(debugData.steps.map(s => s.step)));
    }
  };

  const collapseAll = () => {
    setExpandedSteps(new Set());
  };

  const getStepIcon = (step: DebugStep) => {
    if (step.error) return <AlertTriangle className="h-4 w-4 text-red-500" />;
    if (step.success) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <Calculator className="h-4 w-4 text-blue-500" />;
  };

  const formatValue = (value: any): string => {
    if (typeof value === 'number') {
      return formatNumeric(value);
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  if (!formulaExpression) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Bug className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">Ingen formel å debugge</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Formeldebugger
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDebugModeChange?.(!isDebugging)}
            >
              {isDebugging ? (
                <>
                  <Eye className="h-4 w-4 mr-1" />
                  Debug aktiv
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-1" />
                  Start debug
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!debugData ? (
          <Alert>
            <Bug className="h-4 w-4" />
            <AlertDescription>
              {isDebugging 
                ? "Debug modus er aktiv. Test formelen for å se debug-data."
                : "Aktiver debug-modus og test formelen for å se detaljert kjøringsinformasjon."
              }
            </AlertDescription>
          </Alert>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="steps">Steg ({debugData.steps.length})</TabsTrigger>
              <TabsTrigger value="accounts">Kontoer ({Object.keys(debugData.accountValues).length})</TabsTrigger>
              <TabsTrigger value="variables">Variabler ({Object.keys(debugData.variableValues).length})</TabsTrigger>
            </TabsList>

            <TabsContent value="steps" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {debugData.totalTime}ms
                  </Badge>
                  <Badge variant="default">
                    Resultat: {formatNumeric(debugData.finalResult)}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={expandAll}>
                    Utvid alle
                  </Button>
                  <Button variant="outline" size="sm" onClick={collapseAll}>
                    Lukk alle
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {debugData.steps.map((step) => (
                  <Collapsible
                    key={step.step}
                    open={expandedSteps.has(step.step)}
                    onOpenChange={() => toggleStep(step.step)}
                  >
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                        {expandedSteps.has(step.step) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        {getStepIcon(step)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Steg {step.step}</span>
                            <Badge variant="outline" className="text-xs">
                              {step.operation}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {step.description}
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          <div className="font-mono">
                            {formatValue(step.output)}
                          </div>
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <div className="ml-6 mt-2 p-4 bg-muted/50 rounded-lg space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm font-medium mb-1">Input</div>
                            <pre className="text-xs bg-background p-2 rounded border overflow-x-auto">
                              {formatValue(step.input)}
                            </pre>
                          </div>
                          <div>
                            <div className="text-sm font-medium mb-1">Output</div>
                            <pre className="text-xs bg-background p-2 rounded border overflow-x-auto">
                              {formatValue(step.output)}
                            </pre>
                          </div>
                        </div>

                        {step.error && (
                          <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>{step.error}</AlertDescription>
                          </Alert>
                        )}

                        {step.metadata && (
                          <div>
                            <div className="text-sm font-medium mb-1">Metadata</div>
                            <pre className="text-xs bg-background p-2 rounded border overflow-x-auto">
                              {JSON.stringify(step.metadata, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="accounts" className="space-y-4">
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(debugData.accountValues).map(([account, value]) => (
                  <div key={account} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <code className="text-sm font-mono">{account}</code>
                    </div>
                    <div className="font-mono text-sm">
                      {formatNumeric(value)}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="variables" className="space-y-4">
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(debugData.variableValues).map(([variable, value]) => (
                  <div key={variable} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <code className="text-sm font-mono">{variable}</code>
                    </div>
                    <div className="font-mono text-sm">
                      {formatValue(value)}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}