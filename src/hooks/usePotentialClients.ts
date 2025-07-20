import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface PotentialClient {
  id: string
  org_number: string
  company_name: string
  auditor_org_number: string
  auditor_name: string
  status: 'potential' | 'declined' | 'converted' | 'lost'
  discovered_at: string
  last_seen_at: string
  converted_to_client_id?: string
  notes?: string
  contact_info: Record<string, any>
  brreg_data: Record<string, any>
  created_by?: string
  updated_at: string
}

export interface BulkImportSession {
  id: string
  session_type: string
  auditor_org_number: string
  auditor_name?: string
  total_found: number
  new_potential_clients: number
  updated_clients: number
  lost_clients: number
  status: 'running' | 'completed' | 'failed' | 'cancelled'
  started_by?: string
  started_at: string
  completed_at?: string
  error_message?: string
  session_data: Record<string, any>
}

export const usePotentialClients = (auditorOrgNumber?: string) => {
  return useQuery({
    queryKey: ['potential-clients', auditorOrgNumber],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('exec_sql', {
          sql: auditorOrgNumber 
            ? `SELECT * FROM potential_clients WHERE auditor_org_number = $1 ORDER BY discovered_at DESC`
            : `SELECT * FROM potential_clients ORDER BY discovered_at DESC`,
          params: auditorOrgNumber ? [auditorOrgNumber] : []
        })

      if (error) throw error
      return (data || []) as PotentialClient[]
    },
    enabled: !!auditorOrgNumber
  })
}

export const usePotentialClientsSummary = (auditorOrgNumber?: string) => {
  return useQuery({
    queryKey: ['potential-clients-summary', auditorOrgNumber],
    queryFn: async () => {
      if (!auditorOrgNumber) return null

      const { data, error } = await supabase
        .rpc('exec_sql', {
          sql: `SELECT * FROM get_potential_clients_summary($1)`,
          params: [auditorOrgNumber]
        })

      if (error) throw error
      const summary = (data || [])[0] || { total_potential: 0, new_this_month: 0, converted_count: 0, lost_count: 0 }
      return summary as { total_potential: number; new_this_month: number; converted_count: number; lost_count: number }
    },
    enabled: !!auditorOrgNumber
  })
}

export const useBulkImportSessions = () => {
  return useQuery({
    queryKey: ['bulk-import-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('exec_sql', {
          sql: `SELECT * FROM bulk_import_sessions ORDER BY started_at DESC LIMIT 10`
        })

      if (error) throw error
      return (data || []) as BulkImportSession[]
    }
  })
}

export const useBulkDiscovery = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ auditorOrgNumber, auditorName }: { auditorOrgNumber: string; auditorName?: string }) => {
      const { data, error } = await supabase.functions.invoke('brreg-bulk-discovery', {
        body: { 
          auditor_org_number: auditorOrgNumber,
          auditor_name: auditorName
        }
      })

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      toast({
        title: 'Bulk-søk fullført',
        description: data.message || 'Søket er fullført med suksess'
      })
      queryClient.invalidateQueries({ queryKey: ['potential-clients'] })
      queryClient.invalidateQueries({ queryKey: ['potential-clients-summary'] })
      queryClient.invalidateQueries({ queryKey: ['bulk-import-sessions'] })
    },
    onError: (error: any) => {
      toast({
        title: 'Feil ved bulk-søk',
        description: error.message || 'Det oppstod en feil ved søket',
        variant: 'destructive'
      })
    }
  })
}

export const useUpdatePotentialClientStatus = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status, notes, convertedToClientId }: { 
      id: string
      status: PotentialClient['status']
      notes?: string
      convertedToClientId?: string
    }) => {
      const updates = {
        status,
        updated_at: new Date().toISOString(),
        ...(notes !== undefined && { notes }),
        ...(convertedToClientId && { converted_to_client_id: convertedToClientId })
      }

      const { data, error } = await supabase
        .rpc('exec_sql', {
          sql: `
            UPDATE potential_clients 
            SET status = $2, updated_at = $3
            ${notes !== undefined ? ', notes = $4' : ''}
            ${convertedToClientId ? `, converted_to_client_id = ${notes !== undefined ? '$5' : '$4'}` : ''}
            WHERE id = $1
            RETURNING *
          `,
          params: [
            id, 
            status, 
            updates.updated_at,
            ...(notes !== undefined ? [notes] : []),
            ...(convertedToClientId ? [convertedToClientId] : [])
          ]
        })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      toast({
        title: 'Status oppdatert',
        description: 'Potensiell klient ble oppdatert'
      })
      queryClient.invalidateQueries({ queryKey: ['potential-clients'] })
      queryClient.invalidateQueries({ queryKey: ['potential-clients-summary'] })
    },
    onError: (error: any) => {
      toast({
        title: 'Feil ved oppdatering',
        description: error.message || 'Kunne ikke oppdatere status',
        variant: 'destructive'
      })
    }
  })
}