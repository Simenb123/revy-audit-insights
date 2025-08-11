
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface KPICardsProps {
  totals: {
    capacityHours: number;
    allocatedHours: number;
    utilizationPct: number | null;
  } | undefined;
}

const KPICards: React.FC<KPICardsProps> = ({ totals }) => {
  const capacity = totals?.capacityHours ?? 0;
  const allocated = totals?.allocatedHours ?? 0;
  const utilization = totals?.utilizationPct === null || totals?.utilizationPct === undefined
    ? null
    : Math.round((totals.utilizationPct || 0) * 100);
  const overUnder = capacity - allocated; // positive = under, negative = over

  const items = [
    { label: 'Total kapasitet', value: `${capacity.toFixed(1)} t` },
    { label: 'Fordelt', value: `${allocated.toFixed(1)} t` },
    { label: 'Utnyttelse', value: utilization === null ? '—' : `${utilization}%` },
    { label: overUnder >= 0 ? 'Ledig kapasitet' : 'Overbooket', value: `${Math.abs(overUnder).toFixed(1)} t` },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      {items.map((kpi) => (
        <Card key={kpi.label}>
          <CardHeader className="py-3 md:py-4">
            <CardTitle className="text-sm text-muted-foreground font-medium">{kpi.label}</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="text-xl md:text-2xl font-semibold">{kpi.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default KPICards;
