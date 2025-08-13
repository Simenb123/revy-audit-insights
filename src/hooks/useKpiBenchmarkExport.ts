import { exportArrayToXlsx } from '@/utils/exportToXlsx';
import { toast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/formatters';

export type AggregateMode = 'none' | 'sum' | 'avg';

interface ClientInfo {
  id: string;
  name: string;
  group: string;
}

interface Params {
  showBenchmark: boolean;
  widgetTitle?: string | null;
  selectedFiscalYear: number;
  selectedGroup: string;
  aggregateMode: AggregateMode;
  displayAsPercentage: boolean;
  showCurrency: boolean;
  unitScale: 'none' | 'thousand' | 'million';
  filteredClients: ClientInfo[];
  valuesByClient: Record<string, number>;
}

export function useKpiBenchmarkExport({
  showBenchmark,
  widgetTitle,
  selectedFiscalYear,
  selectedGroup,
  aggregateMode,
  displayAsPercentage,
  showCurrency,
  unitScale,
  filteredClients,
  valuesByClient,
}: Params) {
  const canExport = (() => {
    if (!showBenchmark || filteredClients.length === 0) return false;
    return filteredClients.some((c) => {
      const v = valuesByClient[c.id];
      return typeof v === 'number' && !Number.isNaN(v);
    });
  })();

  const handleExportBenchmark = () => {
    try {
      if (!canExport) {
        toast({ variant: 'destructive', title: 'Ingen data', description: 'Ingen data å eksportere ennå.' });
        return;
      }

      const groupLabel = selectedGroup === 'all' ? 'Alle grupper' : selectedGroup;
      const aggLabel = aggregateMode === 'sum' ? 'Sum' : aggregateMode === 'avg' ? 'Snitt' : 'Ingen';

      // Enhet/skalering lik visningen
      const scaleDivisor = displayAsPercentage
        ? 1
        : unitScale === 'thousand'
          ? 1000
          : unitScale === 'million'
            ? 1_000_000
            : 1;

      const unitLabel = displayAsPercentage
        ? '%'
        : showCurrency
          ? unitScale === 'thousand'
            ? 'kr (i tusen)'
            : unitScale === 'million'
              ? 'kr (i millioner)'
              : 'kr'
          : unitScale === 'thousand'
            ? 'i tusen'
            : unitScale === 'million'
              ? 'i millioner'
              : '';

      const formatForExport = (val?: number | null) => {
        if (typeof val !== 'number' || Number.isNaN(val)) return '';
        if (displayAsPercentage) return `${val.toFixed(1)}%`;
        const scaled = val / scaleDivisor;
        return showCurrency
          ? formatCurrency(scaled)
          : new Intl.NumberFormat('nb-NO', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(scaled);
      };

      // Per-klient rader (filtrert på valgt gruppe)
      const rows: any[] = filteredClients.map((c) => {
        const raw = valuesByClient[c.id];
        return {
          Klient: c.name,
          Konsern: c.group,
          Verdi: formatForExport(raw),
          Enhet: unitLabel,
          Type: 'Klient',
          'Valgt gruppe': groupLabel,
          Aggregering: aggLabel,
        };
      });

      // Konsernaggregater (sum og snitt) for relevante grupper
      const groups = new Map<string, string[]>();
      filteredClients.forEach((c) => {
        const g = c.group || 'Uten gruppe';
        if (!groups.has(g)) groups.set(g, []);
        groups.get(g)!.push(c.id);
      });

      Array.from(groups.entries()).forEach(([g, ids]) => {
        const vals = ids
          .map((id) => valuesByClient[id])
          .filter((v) => typeof v === 'number' && !Number.isNaN(v)) as number[];
        const sum = vals.reduce((s, v) => s + v, 0);
        const avg = vals.length > 0 ? sum / vals.length : 0;
        rows.push({ Klient: 'SUM', Konsern: g, Verdi: formatForExport(sum), Enhet: unitLabel, Type: 'Gruppe SUM', 'Valgt gruppe': groupLabel, Aggregering: aggLabel });
        rows.push({ Klient: 'SNITT', Konsern: g, Verdi: formatForExport(avg), Enhet: unitLabel, Type: 'Gruppe SNITT', 'Valgt gruppe': groupLabel, Aggregering: aggLabel });
      });

      // Overordnet aggregat i henhold til valgt modus
      if (aggregateMode !== 'none') {
        const allVals = filteredClients
          .map((c) => valuesByClient[c.id])
          .filter((v) => typeof v === 'number' && !Number.isNaN(v)) as number[];
        const sum = allVals.reduce((s, v) => s + v, 0);
        const avg = allVals.length > 0 ? sum / allVals.length : 0;
        const val = aggregateMode === 'sum' ? sum : avg;
        rows.push({ Klient: aggregateMode === 'sum' ? 'AGGREGAT (SUM)' : 'AGGREGAT (SNITT)', Konsern: groupLabel, Verdi: formatForExport(val), Enhet: unitLabel, Type: 'AGGREGAT', 'Valgt gruppe': groupLabel, Aggregering: aggLabel });
      }

      const slug = (s: string) => s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const fileName = `${widgetTitle || 'KPI'}-benchmark-${selectedFiscalYear}-grp-${slug(groupLabel)}-agg-${aggregateMode}`;
      exportArrayToXlsx(fileName, rows);
      toast({ title: 'Eksportert', description: `Fil lagret: ${fileName}.xlsx` });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Feil ved eksport', description: e?.message || 'Ukjent feil under eksport.' });
    }
  };

  return { canExport, handleExportBenchmark };
}
