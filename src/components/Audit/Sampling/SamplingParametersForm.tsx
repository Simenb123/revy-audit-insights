import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, Info, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { SamplingParams } from '@/services/sampling/types';
import { formatCurrency, validateSamplingParams } from '@/services/sampling/utils';

interface SamplingParametersFormProps {
  clientId: string;
  onChange?: (params: SamplingParams) => void;
}

const SamplingParametersForm: React.FC<SamplingParametersFormProps> = ({ 
  clientId, 
  onChange 
}) => {
  const { selectedFiscalYear } = useFiscalYear();
  
  const [params, setParams] = useState<SamplingParams>({
    fiscalYear: selectedFiscalYear || new Date().getFullYear(),
    testType: 'SUBSTANTIVE',
    method: 'SRS',
    populationSize: 0,
    populationSum: 0,
    confidenceLevel: 95,
    riskLevel: 'moderat',
    thresholdMode: 'DISABLED',
    confidenceFactor: 1.0,
    minPerStratum: 1,
    riskMatrix: { lav: 0.8, moderat: 1.0, hoy: 1.3 },
    riskWeighting: 'disabled',
    seed: Math.floor(Math.random() * 1000000)
  });

  // Fetch materiality settings
  const { data: materialityData } = useQuery({
    queryKey: ['materiality-settings', clientId, selectedFiscalYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('materiality_settings')
        .select('*')
        .eq('client_id', clientId)
        .eq('fiscal_year', selectedFiscalYear)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!clientId && !!selectedFiscalYear
  });

  // Update parameters when materiality data is loaded
  useEffect(() => {
    if (materialityData) {
      setParams(prev => ({
        ...prev,
        materiality: materialityData.materiality || prev.materiality,
        performanceMateriality: materialityData.working_materiality || prev.performanceMateriality,
        expectedMisstatement: materialityData.working_materiality ? 
          materialityData.working_materiality * 0.1 : prev.expectedMisstatement
      }));
    }
  }, [materialityData]);

  // Notify parent of changes
  useEffect(() => {
    onChange?.(params);
  }, [params, onChange]);

  const handleParamChange = (key: keyof SamplingParams, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const validationErrors = validateSamplingParams(params);

  // Calculate recommended sample size preview
  const getRecommendedSampleSizePreview = () => {
    if (params.testType === 'SUBSTANTIVE' && params.materiality && params.expectedMisstatement) {
      // Simplified MUS calculation for preview
      const poissonFactor = params.confidenceLevel === 99 ? 4.6 : 
                           params.confidenceLevel === 95 ? 3.0 : 2.3;
      const expectedErrorFactor = params.expectedMisstatement / params.materiality;
      const baseSize = Math.ceil((params.populationSum / params.materiality) * 
                                 (poissonFactor + expectedErrorFactor));
      const riskFactor = params.riskMatrix[params.riskLevel];
      return Math.max(30, Math.ceil(baseSize * riskFactor));
    }
    
    if (params.testType === 'CONTROL' && params.tolerableDeviationRate && params.expectedDeviationRate) {
      // Simplified attribute calculation for preview
      const z = params.confidenceLevel === 99 ? 2.58 : 
                params.confidenceLevel === 95 ? 1.96 : 1.65;
      const p = params.expectedDeviationRate / 100;
      const e = (params.tolerableDeviationRate - params.expectedDeviationRate) / 100;
      const baseSize = Math.ceil((z * z * p * (1 - p)) / (e * e));
      const riskFactor = params.riskMatrix[params.riskLevel];
      return Math.max(30, Math.ceil(baseSize * riskFactor));
    }
    
    return null;
  };

  const recommendedSize = getRecommendedSampleSizePreview();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Utvalgsparametere
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="testType">Test type</Label>
            <Select 
              value={params.testType} 
              onValueChange={(value: 'SUBSTANTIVE' | 'CONTROL') => 
                handleParamChange('testType', value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SUBSTANTIVE">Substanstest</SelectItem>
                <SelectItem value="CONTROL">Kontrolltest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="method">Metode</Label>
            <Select 
              value={params.method} 
              onValueChange={(value: 'SRS' | 'SYSTEMATIC' | 'MUS' | 'STRATIFIED') => 
                handleParamChange('method', value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SRS">Tilfeldig utvalg (SRS)</SelectItem>
                <SelectItem value="SYSTEMATIC">Systematisk utvalg</SelectItem>
                <SelectItem value="MUS">Pengeenhetsutvalg (MUS)</SelectItem>
                <SelectItem value="STRATIFIED">Stratifisert utvalg</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confidenceLevel">Konfidensgrad</Label>
            <Select 
              value={params.confidenceLevel.toString()} 
              onValueChange={(value) => handleParamChange('confidenceLevel', parseInt(value))}
            >
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
        </div>

        <Separator />

        {/* Test-Specific Parameters */}
        <Tabs value={params.testType.toLowerCase()} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="substantive">Substanstest</TabsTrigger>
            <TabsTrigger value="control">Kontrolltest</TabsTrigger>
          </TabsList>

          <TabsContent value="substantive" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="materiality">
                  Vesentlighet (TM)
                  {materialityData?.materiality && (
                    <Badge variant="outline" className="ml-2">Hentet</Badge>
                  )}
                </Label>
                <Input
                  id="materiality"
                  type="number"
                  value={params.materiality || ''}
                  onChange={(e) => handleParamChange('materiality', parseFloat(e.target.value) || 0)}
                  placeholder="kr"
                />
                {materialityData?.materiality && (
                  <div className="text-xs text-muted-foreground">
                    Fra vesentlighetsberegning: {formatCurrency(materialityData.materiality)}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="performanceMateriality">
                  Ytelsesvesentlighet (PM)
                  {materialityData?.working_materiality && (
                    <Badge variant="outline" className="ml-2">Hentet</Badge>
                  )}
                </Label>
                <Input
                  id="performanceMateriality"
                  type="number"
                  value={params.performanceMateriality || ''}
                  onChange={(e) => handleParamChange('performanceMateriality', parseFloat(e.target.value) || 0)}
                  placeholder="kr"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expectedMisstatement">Forventet feil (EM)</Label>
                <Input
                  id="expectedMisstatement"
                  type="number"
                  value={params.expectedMisstatement || ''}
                  onChange={(e) => handleParamChange('expectedMisstatement', parseFloat(e.target.value) || 0)}
                  placeholder="kr"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="control" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tolerableDeviation">Tolerabel avviksrate (%)</Label>
                <Input
                  id="tolerableDeviation"
                  type="number"
                  value={params.tolerableDeviationRate || ''}
                  onChange={(e) => handleParamChange('tolerableDeviationRate', parseFloat(e.target.value) || 0)}
                  placeholder="%"
                  min="0"
                  max="100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expectedDeviation">Forventet avviksrate (%)</Label>
                <Input
                  id="expectedDeviation"
                  type="number"
                  value={params.expectedDeviationRate || ''}
                  onChange={(e) => handleParamChange('expectedDeviationRate', parseFloat(e.target.value) || 0)}
                  placeholder="%"
                  min="0"
                  max="100"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Separator />

        {/* Risk and Seed */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="riskLevel">Risikonivå</Label>
            <Select 
              value={params.riskLevel} 
              onValueChange={(value: 'lav' | 'moderat' | 'hoy') => 
                handleParamChange('riskLevel', value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lav">Lav (0.8x)</SelectItem>
                <SelectItem value="moderat">Moderat (1.0x)</SelectItem>
                <SelectItem value="hoy">Høy (1.3x)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="seed">Seed (reproduserbarhet)</Label>
            <div className="flex gap-2">
              <Input
                id="seed"
                type="number"
                value={params.seed}
                onChange={(e) => handleParamChange('seed', parseInt(e.target.value) || 1)}
                min="1"
              />
              <Button
                variant="outline"
                onClick={() => handleParamChange('seed', Math.floor(Math.random() * 1000000))}
              >
                Ny
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Anslått utvalgsstørrelse</Label>
            <div className="flex items-center h-10 px-3 border rounded-md bg-muted">
              {recommendedSize ? (
                <span className="font-medium">{recommendedSize}</span>
              ) : (
                <span className="text-muted-foreground">Ikke tilgjengelig</span>
              )}
            </div>
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-destructive">
              <Info className="h-4 w-4" />
              <span className="font-medium">Parameterfeil</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-sm text-destructive">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SamplingParametersForm;