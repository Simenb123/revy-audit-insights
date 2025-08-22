/**
 * Format a number as Norwegian currency (NOK)
 */
export function formatNOK(amount: number): string {
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Round to 2 decimal places
 */
export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Parse Norwegian number format (1 234,56 -> 1234.56)
 */
export function parseNumber(value: any): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  
  const str = String(value)
    .replace(/\s/g, '') // Remove spaces
    .replace(',', '.'); // Replace comma with dot
  
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

/**
 * Format number with Norwegian thousand separators
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('nb-NO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}