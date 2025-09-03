import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import type { PopulationData } from '@/hooks/usePopulationCalculator';

interface PopulationInsightsProps {
  populationData: PopulationData | null;
  selectedStandardNumbers: string[];
  clientId: string;
  fiscalYear: number;
  hasData: boolean;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    minimumFractionDigits: 0
  }).format(amount);
};

const PopulationInsights: React.FC<PopulationInsightsProps> = ({
  populationData,
  selectedStandardNumbers,
  clientId,
  fiscalYear,
  hasData
}) => {
  // Always render to prevent React #310 - just show different content based on state
  if (!hasData || !populationData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Populasjonsanalyse
          </CardTitle>
          <CardDescription>
            Velg regnskapslinjer for å se populasjonsinnsikt
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 text-sm text-muted-foreground text-center">
            Ingen data valgt for analyse
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Populasjonsanalyse
        </CardTitle>
        <CardDescription>
          {populationData.size} kontoer • {formatCurrency(populationData.sum)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {populationData.size}
              </div>
              <div className="text-sm text-muted-foreground">Kontoer</div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(populationData.sum)}
              </div>
              <div className="text-sm text-muted-foreground">Total sum</div>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            Detaljert analyse kommer når React #310 problemet er løst.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PopulationInsights;