import { useCallback, useState, useEffect } from 'react';
import type { ThemeConfig } from '@/styles/theme';
import { supabase } from '@/integrations/supabase/client';

export interface ReportBuilderSettings {
  selectedVersion?: string;
  isViewMode?: boolean;
  theme?: ThemeConfig;
  introSeen?: boolean;
  // Scope settings (optional)
  scopeType?: 'client' | 'firm' | 'custom';  
  selectedClientIds?: string[];
  // Benchmark UI selections (optional)
  benchmarkAggregateMode?: 'none' | 'sum' | 'avg';
  benchmarkSelectedGroup?: string;
  benchmarkShow?: boolean;
}

const STORAGE_PREFIX = 'report-builder-settings';

function getKey(clientId: string, fiscalYear: number) {
  return `${STORAGE_PREFIX}:${clientId}:${fiscalYear}`;
}

function computeDbKey(clientId: string) {
  return clientId; // plain client key used in DB
}

async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id ?? null;
  } catch {
    return null;
  }
}

export function loadReportBuilderSettings(clientId: string, fiscalYear: number): ReportBuilderSettings | null {
  try {
    if (typeof window === 'undefined') return null;
    const storageKey = getKey(clientId, fiscalYear);
    const raw = localStorage.getItem(storageKey);
    const parsed = raw ? (JSON.parse(raw) as ReportBuilderSettings) : null;

    // Background sync from Supabase (non-blocking)
    (async () => {
      const userId = await getCurrentUserId();
      if (!userId) return;
      const { data, error } = await supabase
        .from('report_builder_settings')
        .select('settings')
        .eq('user_id', userId)
        .eq('client_key', computeDbKey(clientId))
        .eq('fiscal_year', fiscalYear)
        .maybeSingle();

      if (!error && data?.settings) {
        const server = data.settings as ReportBuilderSettings;
        const serverStr = JSON.stringify(server);
        if (serverStr && serverStr !== (raw ?? '')) {
          localStorage.setItem(storageKey, serverStr);
        }
      }
    })().catch(() => {});

    return parsed;
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
    if (typeof window !== 'undefined') {
      localStorage.setItem(getKey(clientId, fiscalYear), JSON.stringify(settings));
    }

    // Persist to Supabase in the background
    (async () => {
      const userId = await getCurrentUserId();
      if (!userId) return;
      await (supabase as any)
        .from('report_builder_settings')
        .upsert(
          {
            user_id: userId,
            client_key: computeDbKey(clientId),
            fiscal_year: fiscalYear,
            settings: settings as any
          },
          { onConflict: 'user_id,client_key,fiscal_year' }
        );
    })().catch(() => {});
  } catch {
    // ignore write errors
  }
}

/**
 * Hook-based API for managing report builder settings with real-time sync
 */
export function useReportBuilderSettings(clientId: string, fiscalYear: number) {
  const [settings, setSettingsState] = useState<ReportBuilderSettings>(() => 
    loadReportBuilderSettings(clientId, fiscalYear) || {}
  );

  // Set up realtime subscription for cross-tab/device sync
  useEffect(() => {
    (async () => {
      const userId = await getCurrentUserId();
      if (!userId) return;

      const channel = supabase
        .channel('report-builder-settings-sync')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'report_builder_settings',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            const newRecord = payload.new as any;
            if (newRecord && 
                newRecord.client_key === computeDbKey(clientId) && 
                newRecord.fiscal_year === fiscalYear) {
              const newSettings = newRecord.settings as ReportBuilderSettings;
              setSettingsState(newSettings);
              // Also update localStorage for consistency
              if (typeof window !== 'undefined') {
                localStorage.setItem(getKey(clientId, fiscalYear), JSON.stringify(newSettings));
              }
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    })();
  }, [clientId, fiscalYear]);

  const saveSettings = useCallback((newSettings: ReportBuilderSettings) => {
    setSettingsState(newSettings);
    saveReportBuilderSettings(clientId, fiscalYear, newSettings);
  }, [clientId, fiscalYear]);

  return [settings, saveSettings] as const;
}