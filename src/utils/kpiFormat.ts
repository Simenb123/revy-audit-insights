// KPI formatting and scaling helpers (shared by benchmark hooks)

export function getScaleDivisor(unitScale: 'none' | 'thousand' | 'million'): number {
  return unitScale === 'thousand' ? 1000 : unitScale === 'million' ? 1_000_000 : 1;
}

export function formatNumeric(value: number): string {
  return new Intl.NumberFormat('nb-NO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

export function getUnitLabel(
  displayAsPercentage: boolean,
  showCurrency: boolean,
  unitScale: 'none' | 'thousand' | 'million'
): string {
  if (displayAsPercentage) return '%';
  if (showCurrency) {
    return unitScale === 'thousand'
      ? 'kr (i tusen)'
      : unitScale === 'million'
        ? 'kr (i millioner)'
        : 'kr';
  }
  return unitScale === 'thousand' ? 'i tusen' : unitScale === 'million' ? 'i millioner' : '';
}
