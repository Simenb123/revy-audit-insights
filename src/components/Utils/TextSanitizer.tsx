import React from 'react';
import { useNorwegianCharText, useSanitizeText } from '@/hooks/useNorwegianChars';

interface TextSanitizerProps {
  text: string | null | undefined;
  className?: string;
  fallback?: string;
}

/**
 * Component that automatically sanitizes text to display Norwegian characters correctly
 * Use this instead of directly displaying text that might have encoding issues
 */
export function TextSanitizer({ text, className, fallback = '—' }: TextSanitizerProps) {
  const sanitizedText = useNorwegianCharText(text);
  
  if (!sanitizedText) {
    return <span className={className}>{fallback}</span>;
  }
  
  return <span className={className}>{sanitizedText}</span>;
}

/**
 * Hook-based text sanitizer for use in other components
 */
export function useSanitizedText(text: string | null | undefined): string {
  const { sanitize } = useSanitizeText();
  return sanitize(text);
}