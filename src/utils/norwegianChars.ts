/**
 * Utility functions for handling Norwegian character encoding issues
 */

// Common Norwegian character replacements for corrupted encodings
const NORWEGIAN_CHAR_MAP = {
  // Lower case
  'Ã¦': 'æ',
  'Ã¸': 'ø', 
  'Ã¥': 'å',
  'Ã¤': 'ä',
  'Ã¶': 'ö',
  // Upper case  
  'Ã†': 'Æ',
  'Ã˜': 'Ø',
  'Ã…': 'Å',
  'Ã„': 'Ä',
  'Ã–': 'Ö',
  // Question mark replacements (fallback when exact encoding is unknown)
  '?': '', // Remove question marks - this will be handled differently
} as const;

/**
 * Fix Norwegian character encoding issues in text
 */
export function fixNorwegianChars(text: string | null | undefined): string {
  if (!text) return '';
  
  let fixed = text;
  
  // Replace known corrupted encodings
  Object.entries(NORWEGIAN_CHAR_MAP).forEach(([corrupted, correct]) => {
    if (corrupted !== '?') { // Skip question mark for now
      fixed = fixed.replace(new RegExp(corrupted, 'g'), correct);
    }
  });
  
  return fixed;
}

/**
 * Check if text contains Norwegian characters
 */
export function hasNorwegianChars(text: string): boolean {
  return /[æøåÆØÅ]/.test(text);
}

/**
 * Check if text has potential encoding issues
 */
export function hasPotentialEncodingIssues(text: string): boolean {
  // Look for common encoding corruption patterns
  return /Ã[¦¸¥†˜…]/.test(text) || 
         // Multiple question marks might indicate encoding issues
         /\?\?\?/.test(text) ||
         // Check for mixed encoding patterns
         /[^\x00-\x7F]/.test(text) && !/[æøåÆØÅ]/.test(text);
}

/**
 * Sanitize text for display, ensuring proper Norwegian character rendering
 */
export function sanitizeDisplayText(text: string | null | undefined): string {
  if (!text) return '';
  
  // First try to fix known encoding issues
  let sanitized = fixNorwegianChars(text);
  
  // Ensure the text is properly encoded for display
  try {
    // Test if the string can be properly encoded/decoded
    const encoded = encodeURIComponent(sanitized);
    const decoded = decodeURIComponent(encoded);
    
    if (decoded === sanitized) {
      return sanitized;
    }
  } catch (error) {
    console.warn('Text encoding issue detected:', error);
  }
  
  return sanitized;
}

/**
 * Create a safe version of text for database storage
 */
export function prepareDatabaseText(text: string): string {
  // Ensure proper UTF-8 encoding
  const fixed = fixNorwegianChars(text);
  
  // Normalize Unicode characters
  return fixed.normalize('NFC');
}

/**
 * Test string with Norwegian characters for development/testing
 */
export const NORWEGIAN_TEST_STRINGS = {
  lowercase: 'æøå',
  uppercase: 'ÆØÅ', 
  mixed: 'Ønskelig håndtering av ærlige størrelser',
  companies: ['Røde Kors Norge', 'Øl & Økonomi AS', 'Ålesund Revisjon'],
  names: ['Lars Øystein', 'Anne-Cathrine Ås', 'Bjørn Håvard']
} as const;