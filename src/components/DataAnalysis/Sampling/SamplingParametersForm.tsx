import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings } from 'lucide-react';

export interface SamplingParams {
  fiscalYear: number;
  testType: 'SUBSTANTIVE' | 'CONTROL';
  method: 'SRS' | 'SYSTEMATIC' | 'MUS' | 'STRATIFIED' | 'THRESHOLD';
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

interface SamplingParametersFormProps {
  params: SamplingParams;
  onChange: (key: keyof SamplingParams, value: any) => void;
}

export const SamplingParametersForm: React.FC<SamplingParametersFormProps> = ({
  params,
  onChange
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Utvalgsparametere
        </CardTitle>
        <CardDescription>
          Konfigurer parametere for utvalgsgenereringen
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="testType">Testtype</Label>
            <Select 
              value={params.testType} 
              onValueChange={(value: 'SUBSTANTIVE' | 'CONTROL') => onChange('testType', value)}
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
            <Label htmlFor="method">Utvalgsmetode</Label>
            <Select 
              value={params.method} 
              onValueChange={(value: any) => onChange('method', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SRS">Tilfeldig utvalg (SRS)</SelectItem>
                <SelectItem value="SYSTEMATIC">Systematisk utvalg</SelectItem>
                <SelectItem value="MUS">Monetær enhetsutvalg (MUS)</SelectItem>
                <SelectItem value="STRATIFIED">Stratifisert utvalg</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confidenceLevel">Konfidensnivå (%)</Label>
            <Select 
              value={params.confidenceLevel.toString()} 
              onValueChange={(value) => onChange('confidenceLevel', parseInt(value))}
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

          <div className="space-y-2">
            <Label htmlFor="materiality">Vesentlighet (NOK)</Label>
            <Input
              id="materiality"
              type="number"
              value={params.materiality || ''}
              onChange={(e) => onChange('materiality', parseFloat(e.target.value) || 0)}
              placeholder="50000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="riskLevel">Risikonivå</Label>
            <Select 
              value={params.riskLevel} 
              onValueChange={(value: 'lav' | 'moderat' | 'hoy') => onChange('riskLevel', value)}
            >
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

          {params.testType === 'CONTROL' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="tolerableDeviationRate">Tolerabel avvikssats (%)</Label>
                <Input
                  id="tolerableDeviationRate"
                  type="number"
                  value={params.tolerableDeviationRate || ''}
                  onChange={(e) => onChange('tolerableDeviationRate', parseFloat(e.target.value) || 0)}
                  placeholder="5"
                  min="0"
                  max="100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expectedDeviationRate">Forventet avvikssats (%)</Label>
                <Input
                  id="expectedDeviationRate"
                  type="number"
                  value={params.expectedDeviationRate || ''}
                  onChange={(e) => onChange('expectedDeviationRate', parseFloat(e.target.value) || 0)}
                  placeholder="1"
                  min="0"
                  max="100"
                />
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
