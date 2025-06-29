import { logger } from '@/utils/logger';

/**
 * Format a date string to a localized format (Norwegian)
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('nb-NO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  } catch (e) {
    logger.error('Error formatting date:', e);
    return dateString;
  }
}

/**
 * Format a number as currency (NOK)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('nb-NO', { 
    style: 'currency', 
    currency: 'NOK',
    maximumFractionDigits: 0 
  }).format(amount);
}
