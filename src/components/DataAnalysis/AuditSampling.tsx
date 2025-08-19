import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Play, Save, Info, TrendingUp, Users, FileSpreadsheet } from 'lucide-react';
import { useCreateAuditLog } from '@/hooks/useCreateAuditLog';

interface AuditSamplingProps {
  clientId: string;
}

interface SamplingParams {
  fiscalYear: number;
  testType: 'SUBSTANTIVE' | 'CONTROL';
  method: 'SRS' | 'SYSTEMATIC' | 'MUS' | 'STRATIFIED' | 'THRESHOLD';
  populationSize: number;
  populationSum: number;
  materiality?: number;
  expectedMisstatement?: number;
  confidenceLevel: number;
  riskLevel: 'lav' | 'moderat' | 'hoy';
  tolerableDeviationRate?: number;
  expectedDeviationRate?: number;
  strataBounds?: string;
  thresholdAmount?: number;
  seed?: number;
  useHighRiskInclusion: boolean;
}

interface Transaction {
  id: string;
  transaction_date: string;
  account_no: string;
  account_name: string;
  description: string;
  amount: number;
  risk_score?: number;
}

interface SamplingResult {
  plan: {
    recommendedSampleSize: number;
    actualSampleSize: number;
    coveragePercentage: number;
    method: string;
    testType: string;
    generatedAt: string;
  };
  sample: Transaction[];
}

const AuditSampling: React.FC<AuditSamplingProps> = ({ clientId }) => {
  const { toast } = useToast();
  const createAuditLog = useCreateAuditLog();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<SamplingResult | null>(null);
  
  const [params, setParams] = useState<SamplingParams>({
    fiscalYear: new Date().getFullYear(),
    testType: 'SUBSTANTIVE',
    method: 'MUS',
    populationSize: 1000,
    populationSum: 1000000,
    materiality: 50000,
    expectedMisstatement: 5000,
    confidenceLevel: 95,
    riskLevel: 'moderat',
    tolerableDeviationRate: 5,
    expectedDeviationRate: 1,
    useHighRiskInclusion: true
  });

  const handleParamChange = (key: keyof SamplingParams, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const generateSample = async () => {
    setIsLoading(true);
    try {
      const payload = {
        clientId,
        ...params,
        strataBounds: params.strataBounds ? 
          params.strataBounds.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n)) : 
          undefined
      };

      const { data, error } = await supabase.functions.invoke('audit-sampling', {
        body: payload
      });

      if (error) throw error;

      setResult(data);
      
      toast({
        title: "Utvalg generert",
        description: `${data.plan.actualSampleSize} transaksjoner valgt med ${data.plan.coveragePercentage.toFixed(1)}% dekning`
      });

    } catch (error) {
      console.error('Sampling error:', error);
      toast({
        title: "Feil ved generering",
        description: error.message || "Kunne ikke generere utvalg",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const savePlan = async () => {
    if (!result) return;
    
    setIsSaving(true);
    try {
      const payload = {
        clientId,
        ...params,
        strataBounds: params.strataBounds ? 
          params.strataBounds.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n)) : 
          undefined,
        save: true
      };

      const { error } = await supabase.functions.invoke('audit-sampling', {
        body: payload
      });

      if (error) throw error;

      // Create audit log
      createAuditLog.mutate({
        clientId,
        actionType: 'analysis_performed',
        areaName: 'sampling',
        description: `Utvalgsplan lagret: ${result.plan.method} metode, ${result.plan.actualSampleSize} elementer`,
        metadata: {
          test_type: result.plan.testType,
          method: result.plan.method,
          sample_size: result.plan.actualSampleSize,
          coverage_percentage: result.plan.coveragePercentage
        }
      });

      toast({
        title: "Plan lagret",
        description: "Utvalgsplanen er lagret i databasen"
      });

    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Feil ved lagring",
        description: error.message || "Kunne ikke lagre plan",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nb-NO');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <FileSpreadsheet className="h-5 w-5 text-primary" />
        <h2 className="text-2xl font-bold">Revisjonsutvalg</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Parameters Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Utvalgsparametere
            </CardTitle>
            <CardDescription>
              Konfigurer parametere for generering av revisjonsutvalg
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fiscalYear">Regnskapsår</Label>
                <Input
                  id="fiscalYear"
                  type="number"
                  value={params.fiscalYear}
                  onChange={(e) => handleParamChange('fiscalYear', parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="testType">Testtype</Label>
                <Select value={params.testType} onValueChange={(value) => handleParamChange('testType', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUBSTANTIVE">Substanstest</SelectItem>
                    <SelectItem value="CONTROL">Kontrolltest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="method">Utvalgsmetode</Label>
                <Select value={params.method} onValueChange={(value) => handleParamChange('method', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SRS">Tilfeldig utvalg (SRS)</SelectItem>
                    <SelectItem value="SYSTEMATIC">Systematisk utvalg</SelectItem>
                    <SelectItem value="MUS">Pengeenhetsutvalg (MUS)</SelectItem>
                    <SelectItem value="STRATIFIED">Stratifisert utvalg</SelectItem>
                    <SelectItem value="THRESHOLD">Terskelutvalg</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="riskLevel">Risikonivå</Label>
                <Select value={params.riskLevel} onValueChange={(value) => handleParamChange('riskLevel', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lav">Lav</SelectItem>
                    <SelectItem value="moderat">Moderat</SelectItem>
                    <SelectItem value="hoy">Høy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="populationSize">Populasjonsstørrelse</Label>
                <Input
                  id="populationSize"
                  type="number"
                  value={params.populationSize}
                  onChange={(e) => handleParamChange('populationSize', parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="populationSum">Populasjonssum (NOK)</Label>
                <Input
                  id="populationSum"
                  type="number"
                  value={params.populationSum}
                  onChange={(e) => handleParamChange('populationSum', parseFloat(e.target.value))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="confidenceLevel">Konfidensnivå (%)</Label>
                <Select value={params.confidenceLevel.toString()} onValueChange={(value) => handleParamChange('confidenceLevel', parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="90">90%</SelectItem>
                    <SelectItem value="95">95%</SelectItem>
                    <SelectItem value="99">99%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="seed">Tilfeldig frø (valgfri)</Label>
                <Input
                  id="seed"
                  type="number"
                  value={params.seed || ''}
                  onChange={(e) => handleParamChange('seed', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="Automatisk generert"
                />
              </div>
            </div>

            {params.testType === 'SUBSTANTIVE' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="materiality">Vesentlighet (NOK)</Label>
                  <Input
                    id="materiality"
                    type="number"
                    value={params.materiality || ''}
                    onChange={(e) => handleParamChange('materiality', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="expectedMisstatement">Forventet feil (NOK)</Label>
                  <Input
                    id="expectedMisstatement"
                    type="number"
                    value={params.expectedMisstatement || ''}
                    onChange={(e) => handleParamChange('expectedMisstatement', parseFloat(e.target.value))}
                  />
                </div>
              </div>
            )}

            {params.testType === 'CONTROL' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tolerableDeviationRate">Tolerabel avviksrate (%)</Label>
                  <Input
                    id="tolerableDeviationRate"
                    type="number"
                    step="0.1"
                    value={params.tolerableDeviationRate || ''}
                    onChange={(e) => handleParamChange('tolerableDeviationRate', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="expectedDeviationRate">Forventet avviksrate (%)</Label>
                  <Input
                    id="expectedDeviationRate"
                    type="number"
                    step="0.1"
                    value={params.expectedDeviationRate || ''}
                    onChange={(e) => handleParamChange('expectedDeviationRate', parseFloat(e.target.value))}
                  />
                </div>
              </div>
            )}

            {params.method === 'STRATIFIED' && (
              <div>
                <Label htmlFor="strataBounds">Stratumgrenser (kommaseparert)</Label>
                <Input
                  id="strataBounds"
                  value={params.strataBounds || ''}
                  onChange={(e) => handleParamChange('strataBounds', e.target.value)}
                  placeholder="10000, 50000, 100000"
                />
              </div>
            )}

            {params.method === 'THRESHOLD' && (
              <div>
                <Label htmlFor="thresholdAmount">Terskelbeløp (NOK)</Label>
                <Input
                  id="thresholdAmount"
                  type="number"
                  value={params.thresholdAmount || ''}
                  onChange={(e) => handleParamChange('thresholdAmount', parseFloat(e.target.value))}
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="useHighRiskInclusion"
                checked={params.useHighRiskInclusion}
                onChange={(e) => handleParamChange('useHighRiskInclusion', e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="useHighRiskInclusion" className="text-sm">
                Inkluder høyrisikotransaksjoner automatisk
              </Label>
            </div>

            <div className="flex gap-2">
              <Button onClick={generateSample} disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Generer utvalg
              </Button>
              
              {result && (
                <Button onClick={savePlan} disabled={isSaving} variant="outline">
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Lagre plan
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Utvalgsresultat
            </CardTitle>
            <CardDescription>
              Oversikt over det genererte utvalget
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">Anbefalt størrelse</div>
                    <div className="text-lg font-semibold">{result.plan.recommendedSampleSize}</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">Faktisk størrelse</div>
                    <div className="text-lg font-semibold">{result.plan.actualSampleSize}</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg col-span-2">
                    <div className="text-sm text-muted-foreground">Dekning</div>
                    <div className="text-lg font-semibold">{result.plan.coveragePercentage.toFixed(1)}%</div>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Valgte transaksjoner</h4>
                  <Badge variant="outline">{result.sample.length} elementer</Badge>
                </div>

                <div className="max-h-96 overflow-auto">
                  <div className="space-y-2">
                    {result.sample.slice(0, 10).map((tx, index) => (
                      <div key={tx.id} className="p-3 border rounded-lg text-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{tx.account_no} - {tx.account_name}</div>
                            <div className="text-muted-foreground">{tx.description}</div>
                            <div className="text-xs text-muted-foreground">{formatDate(tx.transaction_date)}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(tx.amount)}</div>
                            {tx.risk_score && (
                              <Badge 
                                variant={tx.risk_score > 0.8 ? "destructive" : tx.risk_score > 0.5 ? "default" : "secondary"}
                                className="text-xs"
                              >
                                Risk: {(tx.risk_score * 100).toFixed(0)}%
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {result.sample.length > 10 && (
                      <div className="text-center text-sm text-muted-foreground">
                        ... og {result.sample.length - 10} til
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Info className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">
                  Konfigurer parametere og klikk "Generer utvalg" for å starte
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuditSampling;