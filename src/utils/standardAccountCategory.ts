export type BalanceCategoryCode = 'AM' | 'OM' | 'EK' | 'LG' | 'KG' | 'UK';

interface CategoryRange {
  code: BalanceCategoryCode;
  label: string;
  ranges: Array<[number, number]>;
}

// Configurable category ranges for standard statement line numbers
const CATEGORY_RANGES: CategoryRange[] = [
  { code: 'AM', label: 'Anleggsmiddel', ranges: [[1000, 1499]] },
  { code: 'OM', label: 'Omløpsmiddel', ranges: [[1500, 1999]] },
  { code: 'EK', label: 'Egenkapital', ranges: [[2000, 2099]] },
  { code: 'KG', label: 'Kortsiktig gjeld', ranges: [[2100, 2199], [3000, 3999]] },
  { code: 'LG', label: 'Langsiktig gjeld', ranges: [[2200, 2999]] },
];

export function getBalanceCategoryCodeFromNumber(num: number): BalanceCategoryCode {
  for (const cat of CATEGORY_RANGES) {
    if (cat.ranges.some(([start, end]) => num >= start && num <= end)) return cat.code;
  }
  return 'UK'; // Ukjent
}

export function getBalanceCategory(standardNumber: string | number): BalanceCategoryCode {
  const n = typeof standardNumber === 'number' ? standardNumber : parseInt(String(standardNumber).replace(/[^\d]/g, ''), 10);
  if (isNaN(n)) return 'UK';
  return getBalanceCategoryCodeFromNumber(n);
}

export function getBalanceCategoryLabel(code: BalanceCategoryCode): string {
  const found = CATEGORY_RANGES.find((c) => c.code === code);
  if (found) return found.label;
  if (code === 'UK') return 'Ukjent';
  return code;
}
