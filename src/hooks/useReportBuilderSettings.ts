import { useCallback } from 'react';
import type { ThemeConfig } from '@/styles/theme';

export interface ReportBuilderSettings {
  selectedVersion?: string;
  isViewMode?: boolean;
  theme?: ThemeConfig;
  introSeen?: boolean;
  // Scope settings (optional)
  scopeType?: 'client' | 'firm' | 'custom';
  selectedClientIds?: string[];
}

const STORAGE_PREFIX = 'report-builder-settings';

function getKey(clientId: string, fiscalYear: number) {
  return `${STORAGE_PREFIX}:${clientId}:${fiscalYear}`;
}

export function loadReportBuilderSettings(clientId: string, fiscalYear: number): ReportBuilderSettings | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(getKey(clientId, fiscalYear));
    return raw ? (JSON.parse(raw) as ReportBuilderSettings) : null;
  } catch {
    return null;
  }
}

export function saveReportBuilderSettings(
  clientId: string,
  fiscalYear: number,
  settings: ReportBuilderSettings
) {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(getKey(clientId, fiscalYear), JSON.stringify(settings));
  } catch {
    // ignore write errors
  }
}
