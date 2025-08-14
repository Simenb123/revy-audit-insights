import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CheckCircle, AlertTriangle, XCircle, ChevronDown, Info } from "lucide-react";
import { ControlTestResult } from "@/services/controlTestSuite";

interface ControlTestResultsProps {
  results: ControlTestResult[];
  isLoading?: boolean;
}

export const ControlTestResults: React.FC<ControlTestResultsProps> = ({ results, isLoading }) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Kontrolltester</CardTitle>
          <CardDescription>Kjører kontrolltester...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      default:
        return <CheckCircle className="h-5 w-5 text-success" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'warning';
      default:
        return 'success';
    }
  };

  const getTestDisplayName = (testName: string) => {
    const names: Record<string, string> = {
      'voucher_balance': 'Bilagsbalanse',
      'account_flows': 'Kontoforbindelser',
      'duplicates': 'Dubletter',
      'time_logic': 'Tidslogikk',
      'overall_balance': 'Totalbalanse'
    };
    return names[testName] || testName;
  };

  const totalErrors = results.reduce((sum, result) => sum + result.errorCount, 0);
  const passedTests = results.filter(result => result.passed).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Kontrolltester
        </CardTitle>
        <CardDescription>
          {passedTests}/{results.length} tester bestått
          {totalErrors > 0 && ` • ${totalErrors} avvik funnet`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {results.length === 0 ? (
          <Alert>
            <AlertDescription>
              Ingen kontrolltester tilgjengelig. Kjør analyse først.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Sammendrag */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-success">{passedTests}</div>
                <div className="text-sm text-muted-foreground">Bestått</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning">
                  {results.filter(r => r.severity === 'warning').length}
                </div>
                <div className="text-sm text-muted-foreground">Advarsler</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-destructive">
                  {results.filter(r => r.severity === 'error').length}
                </div>
                <div className="text-sm text-muted-foreground">Feil</div>
              </div>
            </div>

            {/* Testresultater */}
            <div className="space-y-3">
              {results.map((result, index) => (
                <Collapsible key={index}>
                  <CollapsibleTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-between p-4 h-auto border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        {getSeverityIcon(result.severity)}
                        <div className="text-left">
                          <div className="font-medium">{getTestDisplayName(result.testName)}</div>
                          <div className="text-sm text-muted-foreground">{result.description}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {result.errorCount > 0 && (
                          <Badge variant={getSeverityColor(result.severity) as any}>
                            {result.errorCount} avvik
                          </Badge>
                        )}
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </Button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="mt-2">
                    <div className="p-4 bg-muted/30 rounded-lg ml-8">
                      {result.passed ? (
                        <div className="text-success font-medium">✓ Test bestått</div>
                      ) : (
                        <div className="space-y-3">
                          <div className="text-destructive font-medium">
                            {result.errorCount} avvik funnet
                          </div>
                          
                          {/* Vis detaljer basert på testtype */}
                          {result.testName === 'voucher_balance' && (
                            <div className="space-y-2">
                              {result.details.slice(0, 5).map((detail: any, i: number) => (
                                <div key={i} className="p-2 bg-background rounded border">
                                  <div className="font-medium">Bilag: {detail.voucherNumber}</div>
                                  <div className="text-sm text-muted-foreground">
                                    Differanse: {detail.difference.toFixed(2)} kr • 
                                    {detail.transactionCount} transaksjoner
                                  </div>
                                </div>
                              ))}
                              {result.details.length > 5 && (
                                <div className="text-sm text-muted-foreground">
                                  ...og {result.details.length - 5} flere
                                </div>
                              )}
                            </div>
                          )}

                          {result.testName === 'duplicates' && (
                            <div className="space-y-2">
                              {result.details.slice(0, 3).map((detail: any, i: number) => (
                                <div key={i} className="p-2 bg-background rounded border">
                                  <div className="font-medium">
                                    {detail.duplicateGroup.amount.toLocaleString('no-NO')} kr
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {detail.duplicateGroup.date} • {detail.duplicateGroup.description}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {detail.duplicateGroup.transactions.length} like transaksjoner
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {result.testName === 'time_logic' && (
                            <div className="space-y-2">
                              {result.details.slice(0, 5).map((detail: any, i: number) => (
                                <div key={i} className="p-2 bg-background rounded border">
                                  <div className="font-medium">{detail.description}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {detail.transactionDate} • Bilag: {detail.voucherNumber}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {result.testName === 'account_flows' && (
                            <div className="space-y-2">
                              {result.details.slice(0, 5).map((detail: any, i: number) => (
                                <div key={i} className="p-2 bg-background rounded border">
                                  <div className="font-medium">
                                    Konto {detail.accountNumber} ({detail.auditArea})
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    Bilag: {detail.voucherNumber}
                                  </div>
                                  <div className="text-xs text-destructive">
                                    {detail.invalidFlowReason}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {result.testName === 'overall_balance' && (
                            <div className="space-y-2">
                              {result.details.map((detail: any, i: number) => (
                                <div key={i} className="grid grid-cols-2 gap-4 text-sm">
                                  <div>Total debet: {detail.totalDebit?.toLocaleString('no-NO')} kr</div>
                                  <div>Total kredit: {detail.totalCredit?.toLocaleString('no-NO')} kr</div>
                                  <div className="col-span-2 font-medium text-destructive">
                                    Differanse: {detail.difference?.toFixed(2)} kr
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};