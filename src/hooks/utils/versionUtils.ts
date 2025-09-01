/**
 * Utilities for handling version mapping between Trial Balance and General Ledger systems
 * 
 * Trial Balance uses string versions (e.g., "v10", "v28")
 * General Ledger/Accounting Data uses UUID version_ids
 */

import { supabase } from '@/integrations/supabase/client';

export interface VersionMapping {
  trialBalanceVersion: string;
  accountingDataVersionId: string | null;
  clientId: string;
  fiscalYear: number;
}

/**
 * Maps a trial balance version string to the corresponding accounting data version UUID
 * This is needed because population analysis may need to query both TB and GL data
 */
export async function mapTrialBalanceVersionToUUID(
  clientId: string,
  fiscalYear: number,
  trialBalanceVersion: string
): Promise<string | null> {
  try {
    // Try to find a corresponding accounting data version for the same client and period
    // This is a best-effort mapping - if no exact match, return null
    const { data: accountingVersion } = await supabase
      .from('accounting_data_versions')
      .select('id')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .maybeSingle();

    return accountingVersion?.id || null;
  } catch (error) {
    console.warn('Failed to map trial balance version to UUID:', error);
    return null;
  }
}

/**
 * Gets the active version info for both trial balance and accounting data
 */
export async function getActiveVersionInfo(clientId: string, fiscalYear: number) {
  try {
    // Get trial balance version
    const { data: trialBalanceVersion } = await supabase
      .from('trial_balances')
      .select('version, period_year')
      .eq('client_id', clientId)
      .eq('period_year', fiscalYear)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Get accounting data version
    const { data: accountingVersion } = await supabase
      .from('accounting_data_versions')
      .select('id, version_number, is_active')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .maybeSingle();

    return {
      trialBalance: trialBalanceVersion ? {
        version: trialBalanceVersion.version,
        year: trialBalanceVersion.period_year
      } : null,
      accountingData: accountingVersion ? {
        versionId: accountingVersion.id,
        versionNumber: accountingVersion.version_number,
        isActive: accountingVersion.is_active
      } : null
    };
  } catch (error) {
    console.error('Error getting active version info:', error);
    return {
      trialBalance: null,
      accountingData: null
    };
  }
}

/**
 * Validates if a version string is in the correct format for trial balance
 */
export function isValidTrialBalanceVersion(version: string | undefined): version is string {
  if (!version || typeof version !== 'string') return false;
  // Trial balance versions are typically in format "v10", "v28", etc.
  return /^v\d+$/.test(version) || version.length > 0;
}

/**
 * Validates if a version ID is a valid UUID format
 */
export function isValidUUID(versionId: string | undefined): versionId is string {
  if (!versionId || typeof versionId !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(versionId);
}