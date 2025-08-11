import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const CapacityCalculator: React.FC = () => {
  const [headcount, setHeadcount] = React.useState<number | ''>('');
  const [avgFte, setAvgFte] = React.useState<number | ''>(''); // 1 = 100%
  const [hoursPerFte, setHoursPerFte] = React.useState<number | ''>(''); // f.eks. 160 timer
  const [absenceHours, setAbsenceHours] = React.useState<number | ''>('');

  const capacity = React.useMemo(() => {
    const h = typeof headcount === 'number' ? headcount : 0;
    const f = typeof avgFte === 'number' ? avgFte : 0;
    const hrs = typeof hoursPerFte === 'number' ? hoursPerFte : 0;
    const abs = typeof absenceHours === 'number' ? absenceHours : 0;
    const total = h * f * hrs - abs;
    return isFinite(total) ? Math.max(0, total) : 0;
  }, [headcount, avgFte, hoursPerFte, absenceHours]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kapasitetskalkulator (måned)</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
        <div>
          <label className="text-sm text-muted-foreground">Antall ansatte</label>
          <Input
            inputMode="numeric"
            value={headcount}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setHeadcount(isNaN(v) ? '' : v);
            }}
            placeholder="f.eks. 20"
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Snitt stillingsandel</label>
          <Input
            inputMode="decimal"
            value={avgFte}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setAvgFte(isNaN(v) ? '' : v);
            }}
            placeholder="1 = 100%"
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Timer pr. FTE pr. mnd</label>
          <Input
            inputMode="decimal"
            value={hoursPerFte}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setHoursPerFte(isNaN(v) ? '' : v);
            }}
            placeholder="f.eks. 160"
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Fravær (timer)</label>
          <Input
            inputMode="decimal"
            value={absenceHours}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setAbsenceHours(isNaN(v) ? '' : v);
            }}
            placeholder="sum fravær"
          />
        </div>
        <div className="col-span-2 md:col-span-4">
          <div className="text-sm text-muted-foreground">Anslått kapasitet denne måneden</div>
          <div className="text-2xl font-semibold">{capacity.toFixed(1)} t</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CapacityCalculator;
