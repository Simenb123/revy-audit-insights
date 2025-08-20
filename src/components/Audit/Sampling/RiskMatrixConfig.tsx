import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Info, Shield, AlertTriangle } from 'lucide-react';
import { RiskMatrix } from '@/services/sampling/types';

interface RiskMatrixConfigProps {
  onChange?: (riskMatrix: RiskMatrix, riskWeighting: 'disabled' | 'moderat' | 'hoy') => void;
}

const RiskMatrixConfig: React.FC<RiskMatrixConfigProps> = ({ onChange }) => {
  const [riskMatrix, setRiskMatrix] = useState<RiskMatrix>({
    lav: 0.8,
    moderat: 1.0,
    hoy: 1.3
  });

  const [riskWeighting, setRiskWeighting] = useState<'disabled' | 'moderat' | 'hoy'>('disabled');

  const handleRiskMatrixChange = (level: keyof RiskMatrix, value: number) => {
    const newMatrix = { ...riskMatrix, [level]: value };
    setRiskMatrix(newMatrix);
    onChange?.(newMatrix, riskWeighting);
  };

  const handleRiskWeightingChange = (value: 'disabled' | 'moderat' | 'hoy') => {
    setRiskWeighting(value);
    onChange?.(riskMatrix, value);
  };

  const resetToDefaults = () => {
    const defaultMatrix = { lav: 0.8, moderat: 1.0, hoy: 1.3 };
    setRiskMatrix(defaultMatrix);
    setRiskWeighting('disabled');
    onChange?.(defaultMatrix, 'disabled');
  };

  const getRiskWeightingDescription = () => {
    switch (riskWeighting) {
      case 'disabled':
        return 'Ingen risikojustering av trekkvekter';
      case 'moderat':
        return 'Moderat risikojustering (α = 0.6)';
      case 'hoy':
        return 'Høy risikojustering (α = 1.0)';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Risikomatrise og -vekting
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Risk Matrix Configuration */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Risikomatrise (utvalgsstørrelsejustering)</Label>
            <Button variant="outline" size="sm" onClick={resetToDefaults}>
              Tilbakestill
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="riskLow" className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                Lav risiko
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="riskLow"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="2.0"
                  value={riskMatrix.lav}
                  onChange={(e) => handleRiskMatrixChange('lav', parseFloat(e.target.value) || 0.8)}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">× n</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Reduserer utvalgsstørrelse
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="riskModerate" className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                Moderat risiko
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="riskModerate"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="2.0"
                  value={riskMatrix.moderat}
                  onChange={(e) => handleRiskMatrixChange('moderat', parseFloat(e.target.value) || 1.0)}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">× n</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Ingen justering (standard)
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="riskHigh" className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                Høy risiko
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="riskHigh"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="2.0"
                  value={riskMatrix.hoy}
                  onChange={(e) => handleRiskMatrixChange('hoy', parseFloat(e.target.value) || 1.3)}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">× n</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Øker utvalgsstørrelse
              </div>
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <div className="font-medium">Risikomatrise</div>
                <div>
                  Endelig utvalgsstørrelse = ceil(n_base × risikofaktor). 
                  Høyere risiko gir større utvalg for å oppnå ønsket sikkerhet.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Weighting for MUS */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Risikovjekting i MUS-utvalg</Label>
          
          <div className="space-y-3">
            <Select value={riskWeighting} onValueChange={handleRiskWeightingChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="disabled">Deaktivert</SelectItem>
                <SelectItem value="moderat">Moderat vekting</SelectItem>
                <SelectItem value="hoy">Høy vekting</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-sm text-muted-foreground">
              {getRiskWeightingDescription()}
            </div>

            {riskWeighting !== 'disabled' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <div className="font-medium">MUS Risikovjekting aktiv</div>
                    <div>
                      Trekkvekt = |beløp| × (1 + α × risikopoeng), hvor α = {riskWeighting === 'moderat' ? '0.6' : '1.0'}.
                      Transaksjoner med høy risiko får økt sannsynlighet for utvalg.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Matrix Preview */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Gjeldende konfigurasjon</Label>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-green-50">
              Lav: {riskMatrix.lav}x
            </Badge>
            <Badge variant="outline" className="bg-yellow-50">
              Moderat: {riskMatrix.moderat}x
            </Badge>
            <Badge variant="outline" className="bg-red-50">
              Høy: {riskMatrix.hoy}x
            </Badge>
            <Badge variant="outline" className={riskWeighting !== 'disabled' ? 'bg-blue-50' : 'bg-gray-50'}>
              MUS-vekting: {riskWeighting}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RiskMatrixConfig;