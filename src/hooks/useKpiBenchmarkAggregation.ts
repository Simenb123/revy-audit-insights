import { formatCurrency } from '@/lib/formatters';
import type { AggregateMode, ClientInfo } from '@/types/kpi';
import { getScaleDivisor, formatNumeric, formatPercent } from '@/utils/kpiFormat';

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
  const scaleDivisorAgg = getScaleDivisor(unitScale);
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
    if (displayAsPercentage) return formatPercent(val);
    const scaled = val / scaleDivisorAgg;
    return showCurrency
      ? formatCurrency(scaled)
      : formatNumeric(scaled);
  })();

  return { aggregatedDisplay };
}
