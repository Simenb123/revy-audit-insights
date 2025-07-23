import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export type PotentialClientStatus = 'potential' | 'declined' | 'converted' | 'lost'

export interface PotentialClient {
  id: string
  org_number: string
  company_name: string
  auditor_org_number: string
  auditor_name: string
  status: PotentialClientStatus
  discovered_at: string
  last_seen_at: string
  converted_to_client_id?: string
  notes?: string
  contact_info: Record<string, any>
  brreg_data: Record<string, any>
  created_by?: string
  updated_at: string
}

export interface PotentialClientsSummary {
  total_potential: number
  new_this_month: number
  converted_count: number
  lost_count: number
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
  status: string
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
      if (!auditorOrgNumber) return []
      
      const { data, error } = await supabase
        .from('potential_clients')
        .select('*')
        .eq('auditor_org_number', auditorOrgNumber)
        .order('discovered_at', { ascending: false })

      if (error) throw error
      return data as PotentialClient[]
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
        .from('potential_clients')
        .select('status, discovered_at')
        .eq('auditor_org_number', auditorOrgNumber)

      if (error) throw error

      const total_potential = data.filter(p => p.status === 'potential').length
      const currentMonth = new Date()
      currentMonth.setDate(1)
      const new_this_month = data.filter(p => 
        p.status === 'potential' && new Date(p.discovered_at) >= currentMonth
      ).length
      const converted_count = data.filter(p => p.status === 'converted').length
      const lost_count = data.filter(p => p.status === 'lost').length

      return {
        total_potential,
        new_this_month,
        converted_count,
        lost_count
      } as PotentialClientsSummary
    },
    enabled: !!auditorOrgNumber
  })
}

export const useBulkImportSessions = (auditorOrgNumber?: string) => {
  return useQuery({
    queryKey: ['bulk-import-sessions', auditorOrgNumber],
    queryFn: async () => {
      if (!auditorOrgNumber) return []
      
      const { data, error } = await supabase
        .from('bulk_import_sessions')
        .select('*')
        .eq('auditor_org_number', auditorOrgNumber)
        .order('started_at', { ascending: false })

      if (error) throw error
      return data as BulkImportSession[]
    },
    enabled: !!auditorOrgNumber
  })
}

export const useBulkDiscovery = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ auditorOrgNumber, auditorName }: { 
      auditorOrgNumber: string;
      auditorName?: string 
    }) => {
      const { data, error } = await supabase.functions.invoke('brreg-bulk-discovery', {
        body: { auditor_org_number: auditorOrgNumber, auditor_name: auditorName }
      })

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['potential-clients'] })
      queryClient.invalidateQueries({ queryKey: ['potential-clients-summary'] })
      queryClient.invalidateQueries({ queryKey: ['bulk-import-sessions'] })
      
      toast.success('Bulk-søk fullført', {
        description: `Fant ${data?.total_found || 0} selskaper, ${data?.new_potential_clients || 0} nye potensielle klienter`
      })
    },
    onError: (error: any) => {
      toast.error('Feil ved bulk-søk', {
        description: error.message || 'Kunne ikke utføre søk mot BRREG'
      })
    }
  })
}

export const useUpdatePotentialClientStatus = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: PotentialClientStatus; notes?: string }): Promise<null> => {
      // Temporarily disabled until database types are updated
      return null
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['potential-clients'] })
      queryClient.invalidateQueries({ queryKey: ['potential-clients-summary'] })
      
      toast.success('Status oppdatert', {
        description: 'Potensiell klient ble oppdatert'
      })
    },
    onError: (error: any) => {
      toast.error('Feil ved oppdatering', {
        description: error.message || 'Kunne ikke oppdatere status'
      })
    }
  })
}