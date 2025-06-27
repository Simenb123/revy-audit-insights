import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Calculator } from 'lucide-react';
import { useUpdateTrainingProgress, useAwardBadge } from '@/hooks/useTraining';

interface VesentlighetModuleProps {
  scenarioId: string;
  scenarioName: string;
}

const VesentlighetModule = ({ scenarioId, scenarioName }: VesentlighetModuleProps) => {
  const [revenue, setRevenue] = useState('');
  const [assets, setAssets] = useState('');
  const [profit, setProfit] = useState('');
  const [materiality, setMateriality] = useState<number | null>(null);
  const [completed, setCompleted] = useState(false);

  const updateProgress = useUpdateTrainingProgress();
  const awardBadge = useAwardBadge();

  const calculateMateriality = () => {
    const rev = parseFloat(revenue) || 0;
    const asset = parseFloat(assets) || 0;
    const prof = Math.abs(parseFloat(profit) || 0);

    const byRevenue = rev * 0.01;
    const byAssets = asset * 0.015;
    const byProfit = prof * 0.05;

    const result = Math.max(byRevenue, byAssets, byProfit);
    setMateriality(result);
  };

  const completeModule = () => {
    if (materiality === null) return;

    updateProgress.mutate({
      scenario_id: scenarioId,
      module_name: 'vesentlighet',
      score: 100,
      max_score: 100,
      completed_at: new Date().toISOString()
    });

    awardBadge.mutate({
      badge_type: 'achievement',
      badge_name: 'Vesentlighetsmester',
      description: 'Fullførte beregning av vesentlighet',
      scenario_id: scenarioId,
      points_earned: 20
    });

    setCompleted(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            Vesentlighetsberegning - {scenarioName}
          </CardTitle>
          <p className="text-gray-600">
            Fyll inn nøkkeltall for å beregne anbefalt vesentlighetsgrense.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="revenue">Omsetning</Label>
              <Input id="revenue" type="number" value={revenue} onChange={e => setRevenue(e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label htmlFor="assets">Sum eiendeler</Label>
              <Input id="assets" type="number" value={assets} onChange={e => setAssets(e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label htmlFor="profit">Resultat før skatt</Label>
              <Input id="profit" type="number" value={profit} onChange={e => setProfit(e.target.value)} placeholder="0" />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button onClick={calculateMateriality} className="w-fit px-8">
              Beregn
            </Button>
            {materiality !== null && (
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-green-600" />
                <span className="font-medium">
                  Anbefalt grense: {materiality.toLocaleString('no-NO', { style: 'currency', currency: 'NOK', maximumFractionDigits: 0 })}
                </span>
              </div>
            )}
          </div>

          {materiality !== null && !completed && (
            <Button onClick={completeModule} className="mt-4">
              Fullfør modul
            </Button>
          )}

          {completed && (
            <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 mt-4">
              Modul fullført!
            </Badge>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VesentlighetModule;
