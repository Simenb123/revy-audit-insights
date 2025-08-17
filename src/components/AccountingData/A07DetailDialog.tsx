import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, DollarSign, Clock, BarChart3 } from 'lucide-react';
import { usePayrollSummary } from '@/hooks/usePayrollImports';
import { 
  usePayrollMonthlySubmissions, 
  usePayrollEmployees, 
  usePayrollRawData 
} from '@/hooks/usePayrollDetailedData';
import { formatCurrency } from '@/lib/formatters';
import { PayrollMonthlySubmissionsTab } from './PayrollMonthlySubmissionsTab';
import { PayrollEmployeesTab } from './PayrollEmployeesTab';
import { PayrollRawDataTab } from './PayrollRawDataTab';

interface A07DetailDialogProps {
  importId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function A07DetailDialog({ importId, open, onOpenChange }: A07DetailDialogProps) {
  const { data: summary } = usePayrollSummary(importId || undefined);
  const { data: monthlySubmissions } = usePayrollMonthlySubmissions(importId || '');
  const { data: employees } = usePayrollEmployees(importId || '');
  const { data: rawData } = usePayrollRawData(importId || '');

  if (!importId) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>A07 Lønnsdata Detaljer</DialogTitle>
          <DialogDescription>
            Komplett oversikt over importerte A07-lønnsdata
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="summary" className="w-full h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="summary">Sammendrag</TabsTrigger>
            <TabsTrigger value="monthly">Månedlige data</TabsTrigger>
            <TabsTrigger value="employees">Ansatte</TabsTrigger>
            <TabsTrigger value="raw">Rådata</TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-y-auto">
            <TabsContent value="summary" className="space-y-6 p-4">
              {summary ? (
                <>
                  {/* Overview Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Building2 className="h-8 w-8 text-primary" />
                          <div>
                            <p className="text-sm text-muted-foreground">Virksomheter</p>
                            <p className="text-2xl font-bold">{summary.antVirks}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Users className="h-8 w-8 text-primary" />
                          <div>
                            <p className="text-sm text-muted-foreground">Inntektsmottakere</p>
                            <p className="text-2xl font-bold">{summary.antMott}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <DollarSign className="h-8 w-8 text-primary" />
                          <div>
                            <p className="text-sm text-muted-foreground">Bruttolønn</p>
                            <p className="text-2xl font-bold">{formatCurrency(summary.bruttolonn)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Detailed Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Financial Summary */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5" />
                          Økonomisk Oversikt
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm">Bruttolønn totalt:</span>
                          <span className="font-medium">{formatCurrency(summary.bruttolonn)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Forskuddstrekk (person):</span>
                          <span className="font-medium">{formatCurrency(summary.trekkPerson)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Forskuddstrekk (innsendinger):</span>
                          <span className="font-medium">{formatCurrency(summary.trekkInns)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">AGA (innsendinger):</span>
                          <span className="font-medium">{formatCurrency(summary.agaInns)}</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Employment Summary */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="h-5 w-5" />
                          Arbeidsforhold
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm">Aktive i perioden:</span>
                          <span className="font-medium">{summary.afAktive}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Nye i perioden:</span>
                          <span className="font-medium">{summary.afNye}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Sluttede i perioden:</span>
                          <span className="font-medium">{summary.afSlutt}</span>
                        </div>
                        {summary.antPInn && (
                          <div className="flex justify-between">
                            <span className="text-sm">Personer innrapportert:</span>
                            <span className="font-medium">{summary.antPInn}</span>
                          </div>
                        )}
                        {summary.antPUni && (
                          <div className="flex justify-between">
                            <span className="text-sm">Unike personer:</span>
                            <span className="font-medium">{summary.antPUni}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* AGA by Zone */}
                  {Object.keys(summary.soner).length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Arbeidsgiveravgift per Sone</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {Object.entries(summary.soner).map(([sone, data]) => (
                            <div key={sone} className="p-4 border rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline">Sone {sone}</Badge>
                                {data.sats != null && (
                                  <Badge variant="secondary">{data.sats}%</Badge>
                                )}
                              </div>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span>Grunnlag:</span>
                                  <span className="font-medium">{formatCurrency(data.grunnlag)}</span>
                                </div>
                                {data.belop && (
                                  <div className="flex justify-between">
                                    <span>AGA beløp:</span>
                                    <span className="font-medium">{formatCurrency(data.belop)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Laster sammendragsdata...</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="monthly" className="p-4">
              <PayrollMonthlySubmissionsTab submissions={monthlySubmissions || []} />
            </TabsContent>

            <TabsContent value="employees" className="p-4">
              <PayrollEmployeesTab employees={employees || []} importId={importId} />
            </TabsContent>

            <TabsContent value="raw" className="p-4">
              <PayrollRawDataTab rawData={rawData} />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}