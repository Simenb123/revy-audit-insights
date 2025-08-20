import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Info, Calculator, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/services/sampling/utils';

interface HighValueThresholdConfigProps {
  onChange?: (config: {
    thresholdMode: 'DISABLED' | 'PM' | 'TM' | 'CUSTOM';
    thresholdAmount?: number;
    confidenceFactor: number;
  }) => void;
  materiality?: number;
  performanceMateriality?: number;
}

const HighValueThresholdConfig: React.FC<HighValueThresholdConfigProps> = ({ 
  onChange,
  materiality,
  performanceMateriality 
}) => {
  const [thresholdMode, setThresholdMode] = useState<'DISABLED' | 'PM' | 'TM' | 'CUSTOM'>('DISABLED');
  const [customThreshold, setCustomThreshold] = useState<number>(0);
  const [confidenceFactor, setConfidenceFactor] = useState<number>(1.0);

  // Calculate automatic threshold amounts
  const pmThreshold = performanceMateriality || 0;
  const tmThreshold = materiality || 0;

  const getCurrentThreshold = () => {
    switch (thresholdMode) {
      case 'PM':
        return pmThreshold;
      case 'TM':
        return tmThreshold;
      case 'CUSTOM':
        return customThreshold;
      default:
        return 0;
    }
  };

  const currentThreshold = getCurrentThreshold();

  useEffect(() => {
    onChange?.({
      thresholdMode,
      thresholdAmount: currentThreshold,
      confidenceFactor
    });
  }, [thresholdMode, customThreshold, confidenceFactor, currentThreshold, onChange]);

  const handleThresholdModeChange = (mode: 'DISABLED' | 'PM' | 'TM' | 'CUSTOM') => {
    setThresholdMode(mode);
  };

  const resetToDefaults = () => {
    setThresholdMode('DISABLED');
    setCustomThreshold(0);
    setConfidenceFactor(1.0);
  };

  const getThresholdDescription = () => {
    switch (thresholdMode) {
      case 'DISABLED':
        return 'Ingen høyverdi-terskel brukes. Alle transaksjoner behandles likt.';
      case 'PM':
        return 'Transaksjoner over ytelsesvesentlighet inkluderes automatisk i utvalget.';
      case 'TM':
        return 'Transaksjoner over totalvesentlighet inkluderes automatisk i utvalget.';
      case 'CUSTOM':
        return 'Transaksjoner over egendefinert terskel inkluderes automatisk i utvalget.';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Høyverdi-terskel konfigurasjon
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Threshold Mode Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Terskel-modus</Label>
            <Button variant="outline" size="sm" onClick={resetToDefaults}>
              Tilbakestill
            </Button>
          </div>

          <Select value={thresholdMode} onValueChange={handleThresholdModeChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DISABLED">Deaktivert</SelectItem>
              <SelectItem value="PM" disabled={!performanceMateriality}>
                Ytelsesvesentlighet (PM)
                {!performanceMateriality && ' - Ikke tilgjengelig'}
              </SelectItem>
              <SelectItem value="TM" disabled={!materiality}>
                Totalvesentlighet (TM)
                {!materiality && ' - Ikke tilgjengelig'}
              </SelectItem>
              <SelectItem value="CUSTOM">Egendefinert beløp</SelectItem>
            </SelectContent>
          </Select>

          <div className="text-sm text-muted-foreground">
            {getThresholdDescription()}
          </div>
        </div>

        {/* Custom Threshold Input */}
        {thresholdMode === 'CUSTOM' && (
          <div className="space-y-2">
            <Label htmlFor="customThreshold">Egendefinert terskel (NOK)</Label>
            <Input
              id="customThreshold"
              type="number"
              min="0"
              step="1000"
              value={customThreshold}
              onChange={(e) => setCustomThreshold(parseFloat(e.target.value) || 0)}
              placeholder="Angi terskel i NOK"
            />
          </div>
        )}

        {/* Current Threshold Display */}
        {thresholdMode !== 'DISABLED' && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="h-4 w-4 text-blue-600" />
              <div className="font-medium text-blue-800">Gjeldende terskel</div>
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {formatCurrency(currentThreshold)}
            </div>
            <div className="text-sm text-blue-700 mt-1">
              Transaksjoner over dette beløpet inkluderes automatisk
            </div>
          </div>
        )}

        {/* Confidence Factor */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Konfidenskoeffisient</Label>
          
          <div className="grid grid-cols-3 gap-2">
            {[0.8, 1.0, 1.2].map(factor => (
              <Button
                key={factor}
                variant={confidenceFactor === factor ? "default" : "outline"}
                size="sm"
                onClick={() => setConfidenceFactor(factor)}
              >
                {factor}
              </Button>
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            <Label htmlFor="customConfidence" className="text-sm">Egendefinert:</Label>
            <Input
              id="customConfidence"
              type="number"
              min="0.1"
              max="3.0"
              step="0.1"
              value={confidenceFactor}
              onChange={(e) => setConfidenceFactor(parseFloat(e.target.value) || 1.0)}
              className="w-20"
            />
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800">
                <div className="font-medium">Konfidenskoeffisient</div>
                <div>
                  Brukes til å beregne foreslått terskel basert på vesentlighet og forventet feil.
                  Høyere verdi = lavere terskel = flere høyverdi-transaksjoner.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Available Thresholds Overview */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Tilgjengelige terskler</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="flex items-center justify-between p-2 border rounded">
              <span className="text-sm">Ytelsesvesentlighet</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">
                  {performanceMateriality ? formatCurrency(performanceMateriality) : 'Ikke satt'}
                </span>
                {performanceMateriality && thresholdMode === 'PM' && (
                  <Badge variant="default" className="text-xs">Aktiv</Badge>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between p-2 border rounded">
              <span className="text-sm">Totalvesentlighet</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">
                  {materiality ? formatCurrency(materiality) : 'Ikke satt'}
                </span>
                {materiality && thresholdMode === 'TM' && (
                  <Badge variant="default" className="text-xs">Aktiv</Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HighValueThresholdConfig;