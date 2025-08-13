import { formatCurrency } from '@/lib/formatters';

export type AggregateMode = 'none' | 'sum' | 'avg';

interface ClientInfo { id: string; name: string; group: string }

interface Params {
  showBenchmark: boolean;
  aggregateMode: AggregateMode;
  displayAsPercentage: boolean;
  showCurrency: boolean;
  unitScale: 'none' | 'thousand' | 'million';
  selectedGroup: string;
  clientsInfo: ClientInfo[];
  valuesByClient: Record<string, number>;
}

export function useKpiBenchmarkAggregation({
  showBenchmark,
  aggregateMode,
  displayAsPercentage,
  showCurrency,
  unitScale,
  selectedGroup,
  clientsInfo,
  valuesByClient,
}: Params) {
  const scaleDivisorAgg = unitScale === 'thousand' ? 1000 : unitScale === 'million' ? 1_000_000 : 1;
  const selectedIds = (selectedGroup === 'all'
    ? clientsInfo.map((c) => c.id)
    : clientsInfo.filter((c) => c.group === selectedGroup).map((c) => c.id));
  const aggVals = selectedIds
    .map((id) => valuesByClient[id])
    .filter((v) => typeof v === 'number' && !Number.isNaN(v)) as number[];
  const aggSum = aggVals.reduce((s, v) => s + v, 0);
  const aggAvg = aggVals.length ? aggSum / aggVals.length : 0;

  const aggregatedDisplay = (() => {
    if (!showBenchmark || aggregateMode === 'none') return null;
    if (aggVals.length === 0) return null;
    const val = aggregateMode === 'sum' ? aggSum : aggAvg;
    if (displayAsPercentage) return `${val.toFixed(1)}%`;
    const scaled = val / scaleDivisorAgg;
    return showCurrency
      ? formatCurrency(scaled)
      : new Intl.NumberFormat('nb-NO', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(scaled);
  })();

  return { aggregatedDisplay };
}
