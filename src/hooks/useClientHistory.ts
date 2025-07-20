import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface ClientHistoryLog {
  id: string
  client_id: string
  change_type: 'created' | 'updated' | 'role_change' | 'auditor_change' | 'contact_change' | 'brreg_sync'
  field_name?: string
  old_value?: string
  new_value?: string
  change_source: 'manual' | 'brreg_sync' | 'bulk_import' | 'system'
  changed_by?: string
  change_metadata: Record<string, any>
  created_at: string
  description?: string
}

export interface ClientAuditorHistory {
  id: string
  client_id: string
  auditor_org_number: string
  auditor_name: string
  auditor_type?: 'revisor' | 'regnskapsfører' | 'autorisert_regnskapsfører'
  valid_from: string
  valid_to?: string
  is_current: boolean
  discovered_via: 'brreg_sync' | 'manual_entry' | 'bulk_import'
  brreg_data: Record<string, any>
  created_at: string
  updated_at: string
}

export const useClientHistory = (clientId: string) => {
  return useQuery({
    queryKey: ['client-history', clientId],
    queryFn: async () => {
      // Temporarily disabled until database types are updated
      return [] as (ClientHistoryLog & { 
        first_name?: string; 
        last_name?: string 
      })[]
    },
    enabled: !!clientId
  })
}

export const useClientAuditorHistory = (clientId: string) => {
  return useQuery({
    queryKey: ['client-auditor-history', clientId],
    queryFn: async () => {
      // Temporarily disabled until database types are updated
      return [] as ClientAuditorHistory[]
    },
    enabled: !!clientId
  })
}

export const useClientHistoryStats = (clientId: string) => {
  return useQuery({
    queryKey: ['client-history-stats', clientId],
    queryFn: async () => {
      // Temporarily disabled until database types are updated
      return {
        total_changes: 0,
        manual_changes: 0,
        brreg_syncs: 0,
        role_changes: 0,
        auditor_changes: 0,
        last_change_at: null
      }
    },
    enabled: !!clientId
  })
}
