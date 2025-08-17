/**
 * ISIN validation and country extraction utilities for investment securities
 */

export interface ISINValidationResult {
  isValid: boolean;
  countryCode?: string;
  error?: string;
}

/**
 * Validates an ISIN code according to ISO 6166 standard
 * Format: 2 country letters + 9 alphanumeric + 1 check digit
 */
export function validateISIN(isin: string): ISINValidationResult {
  if (!isin) {
    return { isValid: false, error: 'ISIN er påkrevd' };
  }

  // Remove spaces and convert to uppercase
  const cleanIsin = isin.replace(/\s/g, '').toUpperCase();

  // Check length
  if (cleanIsin.length !== 12) {
    return { isValid: false, error: 'ISIN må være 12 tegn' };
  }

  // Check first two characters are letters (country code)
  const countryCode = cleanIsin.substring(0, 2);
  if (!/^[A-Z]{2}$/.test(countryCode)) {
    return { isValid: false, error: 'Første to tegn må være landkode (bokstaver)' };
  }

  // Check next 9 characters are alphanumeric
  const nsin = cleanIsin.substring(2, 11);
  if (!/^[A-Z0-9]{9}$/.test(nsin)) {
    return { isValid: false, error: 'Tegn 3-11 må være alphanumeriske' };
  }

  // Check digit validation (Luhn algorithm modified for alphanumeric)
  const checkDigit = cleanIsin.substring(11, 12);
  if (!/^[0-9]$/.test(checkDigit)) {
    return { isValid: false, error: 'Siste tegn må være et tall (sjekkssiffer)' };
  }

  // Convert letters to numbers (A=10, B=11, etc.)
  const converted = cleanIsin.substring(0, 11)
    .split('')
    .map(char => {
      if (/[A-Z]/.test(char)) {
        return (char.charCodeAt(0) - 55).toString();
      }
      return char;
    })
    .join('');

  // Apply Luhn algorithm
  let sum = 0;
  let shouldDouble = converted.length % 2 === 0;

  for (let i = 0; i < converted.length; i++) {
    let digit = parseInt(converted[i]);
    
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit = Math.floor(digit / 10) + (digit % 10);
      }
    }
    
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  const calculatedCheckDigit = (10 - (sum % 10)) % 10;
  
  if (calculatedCheckDigit !== parseInt(checkDigit)) {
    return { isValid: false, error: 'Ugyldig ISIN - sjekkssiffer stemmer ikke' };
  }

  return {
    isValid: true,
    countryCode
  };
}

/**
 * Extracts country code from ISIN
 */
export function getCountryFromISIN(isin: string): string | null {
  const validation = validateISIN(isin);
  return validation.isValid ? validation.countryCode! : null;
}

/**
 * Formats ISIN with spaces for better readability
 */
export function formatISIN(isin: string): string {
  const cleanIsin = isin.replace(/\s/g, '').toUpperCase();
  if (cleanIsin.length === 12) {
    return `${cleanIsin.substring(0, 2)} ${cleanIsin.substring(2, 6)} ${cleanIsin.substring(6, 10)} ${cleanIsin.substring(10, 12)}`;
  }
  return cleanIsin;
}

/**
 * Common country codes and their risk levels for exemption method
 */
export const COUNTRY_RISK_MAPPING: Record<string, 'low' | 'medium' | 'high'> = {
  // Low risk (Nordic countries, established markets)
  'NO': 'low',    // Norway
  'SE': 'low',    // Sweden
  'DK': 'low',    // Denmark
  'FI': 'low',    // Finland
  'IS': 'low',    // Iceland
  
  // Medium risk (established markets but some tax treaty complexity)
  'US': 'medium', // United States
  'GB': 'medium', // United Kingdom
  'LU': 'medium', // Luxembourg
  'DE': 'medium', // Germany
  'FR': 'medium', // France
  'NL': 'medium', // Netherlands
  'CH': 'medium', // Switzerland
  'CA': 'medium', // Canada
  'AU': 'medium', // Australia
  'JP': 'medium', // Japan
  
  // High risk (known tax havens, complex jurisdictions)
  'BM': 'high',   // Bermuda
  'KY': 'high',   // Cayman Islands
  'JE': 'high',   // Jersey
  'GG': 'high',   // Guernsey
  'IM': 'high',   // Isle of Man
  'VG': 'high',   // British Virgin Islands
  'BS': 'high',   // Bahamas
  'BB': 'high',   // Barbados
  'PA': 'high',   // Panama
  'MC': 'high',   // Monaco
  'LI': 'high',   // Liechtenstein
  'AD': 'high',   // Andorra
  'MT': 'high',   // Malta
  'CY': 'high',   // Cyprus
};

/**
 * Gets risk level for a country code
 */
export function getRiskLevelForCountry(countryCode: string): 'low' | 'medium' | 'high' | 'unknown' {
  return COUNTRY_RISK_MAPPING[countryCode] || 'unknown';
}

/**
 * Gets risk level directly from ISIN
 */
export function getRiskLevelFromISIN(isin: string): 'low' | 'medium' | 'high' | 'unknown' | 'invalid' {
  const validation = validateISIN(isin);
  if (!validation.isValid) {
    return 'invalid';
  }
  return getRiskLevelForCountry(validation.countryCode!);
}