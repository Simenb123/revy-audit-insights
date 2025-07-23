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
      const { data, error } = await supabase
        .from('client_history_logs')
        .select(`
          id,
          client_id,
          change_type,
          field_name,
          old_value,
          new_value,
          change_source,
          changed_by,
          change_metadata,
          description,
          created_at
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data || []).map(item => ({
        id: item.id,
        client_id: item.client_id,
        change_type: item.change_type as ClientHistoryLog['change_type'],
        field_name: item.field_name,
        old_value: item.old_value,
        new_value: item.new_value,
        change_source: item.change_source as ClientHistoryLog['change_source'],
        changed_by: item.changed_by,
        change_metadata: item.change_metadata,
        description: item.description,
        created_at: item.created_at
      })) as (ClientHistoryLog & { 
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
        .from('client_auditor_history')
        .select('*')
        .eq('client_id', clientId)
        .order('valid_from', { ascending: false })

      if (error) throw error

      return (data || []).map(item => ({
        id: item.id,
        client_id: item.client_id,
        auditor_org_number: item.auditor_org_number,
        auditor_name: item.auditor_name,
        auditor_type: item.auditor_type as ClientAuditorHistory['auditor_type'],
        valid_from: item.valid_from,
        valid_to: item.valid_to,
        is_current: item.is_current,
        discovered_via: item.discovered_via as ClientAuditorHistory['discovered_via'],
        brreg_data: item.brreg_data,
        created_at: item.created_at,
        updated_at: item.updated_at
      }))
    },
    enabled: !!clientId
  })
}

export const useClientHistoryStats = (clientId: string) => {
  return useQuery({
    queryKey: ['client-history-stats', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_history_logs')
        .select('change_type, change_source, created_at')
        .eq('client_id', clientId)

      if (error) throw error

      const logs = data || []
      
      return {
        total_changes: logs.length,
        manual_changes: logs.filter(log => log.change_source === 'manual').length,
        brreg_syncs: logs.filter(log => log.change_source === 'brreg_sync').length,
        role_changes: logs.filter(log => log.change_type === 'role_change').length,
        auditor_changes: logs.filter(log => log.change_type === 'auditor_change').length,
        last_change_at: logs.length > 0 ? logs[0].created_at : null
      }
    },
    enabled: !!clientId
  })
}
