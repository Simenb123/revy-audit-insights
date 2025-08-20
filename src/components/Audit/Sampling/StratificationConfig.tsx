import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Layers, Info, Calculator, TrendingUp } from 'lucide-react';
import { formatCurrency, generateQuantileStrata } from '@/services/sampling/utils';

interface StratificationConfigProps {
  onChange?: (config: {
    enabled: boolean;
    strataBounds?: number[];
    minPerStratum: number;
    method: 'QUANTILE' | 'CUSTOM' | 'EQUAL_WIDTH';
    numStrata: number;
  }) => void;
  populationAmounts?: number[];
  totalPopulationSum?: number;
}

const StratificationConfig: React.FC<StratificationConfigProps> = ({ 
  onChange,
  populationAmounts = [],
  totalPopulationSum = 0
}) => {
  const [enabled, setEnabled] = useState(false);
  const [method, setMethod] = useState<'QUANTILE' | 'CUSTOM' | 'EQUAL_WIDTH'>('QUANTILE');
  const [numStrata, setNumStrata] = useState(4);
  const [minPerStratum, setMinPerStratum] = useState(5);
  const [customBounds, setCustomBounds] = useState<string>('');

  // Calculate automatic strata bounds based on method
  const getStrataBounds = (): number[] => {
    if (!enabled || populationAmounts.length === 0) return [];

    switch (method) {
      case 'QUANTILE':
        return generateQuantileStrata(populationAmounts, numStrata);
      
      case 'EQUAL_WIDTH':
        const min = Math.min(...populationAmounts);
        const max = Math.max(...populationAmounts);
        const width = (max - min) / numStrata;
        return Array.from({ length: numStrata - 1 }, (_, i) => min + width * (i + 1));
      
      case 'CUSTOM':
        try {
          return customBounds
            .split(',')
            .map(b => parseFloat(b.trim()))
            .filter(n => !isNaN(n))
            .sort((a, b) => a - b);
        } catch {
          return [];
        }
      
      default:
        return [];
    }
  };

  const strataBounds = getStrataBounds();

  // Calculate stratum statistics
  const getStratumStats = () => {
    if (!enabled || strataBounds.length === 0) return [];

    const strata: Array<{
      index: number;
      lowerBound: number;
      upperBound?: number;
      count: number;
      sum: number;
      percentage: number;
    }> = [];

    // Create strata ranges
    for (let i = 0; i <= strataBounds.length; i++) {
      const lowerBound = i === 0 ? 0 : strataBounds[i - 1];
      const upperBound = i === strataBounds.length ? undefined : strataBounds[i];
      
      const transactions = populationAmounts.filter(amount => {
        if (upperBound === undefined) {
          return amount >= lowerBound;
        }
        return amount >= lowerBound && amount < upperBound;
      });

      const sum = transactions.reduce((total, amount) => total + amount, 0);
      const percentage = totalPopulationSum > 0 ? (sum / totalPopulationSum) * 100 : 0;

      strata.push({
        index: i,
        lowerBound,
        upperBound,
        count: transactions.length,
        sum,
        percentage
      });
    }

    return strata;
  };

  const stratumStats = getStratumStats();

  useEffect(() => {
    onChange?.({
      enabled,
      strataBounds: enabled ? strataBounds : undefined,
      minPerStratum,
      method,
      numStrata
    });
  }, [enabled, strataBounds, minPerStratum, method, numStrata, onChange]);

  const handleEnabledChange = (checked: boolean) => {
    setEnabled(checked);
    if (!checked) {
      // Reset to defaults when disabled
      setMethod('QUANTILE');
      setNumStrata(4);
      setMinPerStratum(5);
      setCustomBounds('');
    }
  };

  const resetToDefaults = () => {
    setMethod('QUANTILE');
    setNumStrata(4);
    setMinPerStratum(5);
    setCustomBounds('');
  };

  const getMethodDescription = () => {
    switch (method) {
      case 'QUANTILE':
        return 'Deler populasjonen i like store grupper basert på beløpsstørrelse (anbefalt)';
      case 'EQUAL_WIDTH':
        return 'Lager strata med like store beløpsintervaller';
      case 'CUSTOM':
        return 'Egendefinerte grenser for stratifisering';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5" />
          Stratifisering
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-base font-medium">Aktiver stratifisering</Label>
            <div className="text-sm text-muted-foreground">
              Del populasjonen i lag basert på beløpsstørrelse for mer effektiv sampling
            </div>
          </div>
          <Switch checked={enabled} onCheckedChange={handleEnabledChange} />
        </div>

        {enabled && (
          <>
            <Separator />

            {/* Method Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Stratifiseringsmetode</Label>
                <Button variant="outline" size="sm" onClick={resetToDefaults}>
                  Tilbakestill
                </Button>
              </div>

              <Select value={method} onValueChange={(value: 'QUANTILE' | 'CUSTOM' | 'EQUAL_WIDTH') => setMethod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="QUANTILE">Quantile-basert (anbefalt)</SelectItem>
                  <SelectItem value="EQUAL_WIDTH">Like intervaller</SelectItem>
                  <SelectItem value="CUSTOM">Egendefinerte grenser</SelectItem>
                </SelectContent>
              </Select>

              <div className="text-sm text-muted-foreground">
                {getMethodDescription()}
              </div>
            </div>

            {/* Number of Strata (for automatic methods) */}
            {method !== 'CUSTOM' && (
              <div className="space-y-2">
                <Label htmlFor="numStrata">Antall strata</Label>
                <div className="flex items-center gap-2">
                  {[3, 4, 5, 6].map(num => (
                    <Button
                      key={num}
                      variant={numStrata === num ? "default" : "outline"}
                      size="sm"
                      onClick={() => setNumStrata(num)}
                    >
                      {num}
                    </Button>
                  ))}
                </div>
                <div className="text-sm text-muted-foreground">
                  Anbefalt: 4-5 strata for balanse mellom presisjon og kompleksitet
                </div>
              </div>
            )}

            {/* Custom Bounds Input */}
            {method === 'CUSTOM' && (
              <div className="space-y-2">
                <Label htmlFor="customBounds">Egendefinerte grenser (NOK)</Label>
                <Input
                  id="customBounds"
                  placeholder="f.eks: 10000, 50000, 100000, 500000"
                  value={customBounds}
                  onChange={(e) => setCustomBounds(e.target.value)}
                />
                <div className="text-sm text-muted-foreground">
                  Skriv inn beløpsgrenser separert med komma, sortert fra lavest til høyest
                </div>
              </div>
            )}

            {/* Minimum per Stratum */}
            <div className="space-y-2">
              <Label htmlFor="minPerStratum">Minimum utvalg per stratum</Label>
              <Input
                id="minPerStratum"
                type="number"
                min="1"
                max="50"
                value={minPerStratum}
                onChange={(e) => setMinPerStratum(parseInt(e.target.value) || 5)}
                className="w-20"
              />
              <div className="text-sm text-muted-foreground">
                Garanterer minimum representasjon fra hvert stratum
              </div>
            </div>

            {/* Stratum Preview */}
            {stratumStats.length > 0 && populationAmounts.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <Label className="text-base font-medium">Stratum-oversikt</Label>
                  <Badge variant="outline">{stratumStats.length} strata</Badge>
                </div>

                <div className="grid gap-2">
                  {stratumStats.map((stratum) => (
                    <div key={stratum.index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">Stratum {stratum.index + 1}</div>
                        <Badge variant="secondary">
                          {formatCurrency(stratum.sum)} ({stratum.percentage.toFixed(1)}%)
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Beløpsintervall</div>
                          <div className="font-mono">
                            {formatCurrency(stratum.lowerBound)} - {
                              stratum.upperBound ? formatCurrency(stratum.upperBound) : '∞'
                            }
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Antall transaksjoner</div>
                          <div className="font-medium">{stratum.count}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <div className="font-medium">Stratifisering aktiv</div>
                      <div>
                        Populasjonen vil deles i {stratumStats.length} strata. 
                        Minimum {minPerStratum} transaksjoner vil velges fra hvert stratum,
                        deretter fordeles resten proportjonalt basert på stratum-størrelse.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Warning for insufficient population */}
            {enabled && populationAmounts.length === 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-amber-600 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <div className="font-medium">Populasjonsdata mangler</div>
                    <div>
                      Velg populasjon først for å konfigurere stratifisering effektivt.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default StratificationConfig;