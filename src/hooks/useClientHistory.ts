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
      // Since the new tables aren't in types yet, we'll use raw SQL
      const { data, error } = await supabase
        .rpc('exec_sql', { 
          sql: `
            SELECT chl.*, p.first_name, p.last_name
            FROM client_history_log chl
            LEFT JOIN profiles p ON chl.changed_by = p.id
            WHERE chl.client_id = $1
            ORDER BY chl.created_at DESC
          `,
          params: [clientId]
        })

      if (error) throw error
      return (data || []) as (ClientHistoryLog & { 
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
      const { data, error } = await supabase
        .rpc('exec_sql', {
          sql: `
            SELECT * FROM client_auditor_history 
            WHERE client_id = $1 
            ORDER BY valid_from DESC
          `,
          params: [clientId]
        })

      if (error) throw error
      return (data || []) as ClientAuditorHistory[]
    },
    enabled: !!clientId
  })
}

export const useClientHistoryStats = (clientId: string) => {
  return useQuery({
    queryKey: ['client-history-stats', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('exec_sql', {
          sql: `
            SELECT change_type, change_source, created_at 
            FROM client_history_log 
            WHERE client_id = $1
            ORDER BY created_at DESC
          `,
          params: [clientId]
        })

      if (error) throw error

      const historyData = (data || []) as Array<{
        change_type: string
        change_source: string
        created_at: string
      }>

      const stats = {
        total_changes: historyData.length,
        manual_changes: historyData.filter(h => h.change_source === 'manual').length,
        brreg_syncs: historyData.filter(h => h.change_source === 'brreg_sync').length,
        role_changes: historyData.filter(h => h.change_type === 'role_change').length,
        auditor_changes: historyData.filter(h => h.change_type === 'auditor_change').length,
        last_change_at: historyData.length > 0 ? historyData[0].created_at : null
      }

      return stats
    },
    enabled: !!clientId
  })
}