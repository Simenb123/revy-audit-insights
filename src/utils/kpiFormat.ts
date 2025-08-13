/**
 * Return the numeric divisor used to scale values for display.
 * - 'none' => 1
 * - 'thousand' => 1,000
 * - 'million' => 1,000,000
 */
export function getScaleDivisor(unitScale: 'none' | 'thousand' | 'million'): number {
  return unitScale === 'thousand' ? 1000 : unitScale === 'million' ? 1_000_000 : 1;
}

/**
 * Format a plain numeric value with Norwegian locale (0–2 decimals).
 */
export function formatNumeric(value: number): string {
  return new Intl.NumberFormat('nb-NO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format a numeric value as percent with adjustable precision (default 1 decimal).
 */
export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

/**
 * Compute the unit label based on display options.
 * Examples: '%', 'kr (i tusen)', 'i millioner', ''
 */
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
