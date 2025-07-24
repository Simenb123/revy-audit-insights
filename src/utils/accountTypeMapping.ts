// Mapping between English and Norwegian account types
export const accountTypeMapping = {
  // English to Norwegian
  'asset': 'eiendeler',
  'liability': 'gjeld', 
  'equity': 'egenkapital',
  'revenue': 'resultat',
  'expense': 'resultat',
  
  // Norwegian to English  
  'eiendeler': 'asset',
  'gjeld': 'liability',
  'egenkapital': 'equity', 
  'resultat': 'revenue'
} as const;

export function convertAccountType(type: string): string {
  const normalizedType = type?.toLowerCase().trim();
  
  // Direct mapping
  if (accountTypeMapping[normalizedType as keyof typeof accountTypeMapping]) {
    return accountTypeMapping[normalizedType as keyof typeof accountTypeMapping];
  }
  
  // Fallback for common variations
  const fallbacks: Record<string, string> = {
    'income': 'resultat',
    'cost': 'resultat',
    'expense': 'resultat',
    'aktiva': 'eiendeler',
    'passiva': 'gjeld',
    'kostnad': 'resultat',
    'inntekt': 'resultat'
  };
  
  if (fallbacks[normalizedType]) {
    return fallbacks[normalizedType];
  }
  
  // Default fallback
  return 'eiendeler';
}

export function convertToNorwegian(englishType: string): 'eiendeler' | 'gjeld' | 'egenkapital' | 'resultat' {
  const result = convertAccountType(englishType);
  return result as 'eiendeler' | 'gjeld' | 'egenkapital' | 'resultat';
}

export function convertToEnglish(norwegianType: string): 'asset' | 'liability' | 'equity' | 'revenue' | 'expense' {
  const result = convertAccountType(norwegianType);
  return result as 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
}