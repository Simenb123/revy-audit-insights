import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useFiscalYear } from '@/contexts/FiscalYearContext'

export interface PayrollImport {
  id: string
  client_id: string
  period_key: string
  file_name?: string
  avstemmingstidspunkt?: string
  fom_kalendermaaned?: string
  tom_kalendermaaned?: string
  orgnr?: string
  navn?: string
  antall_personer_innrapportert?: number
  antall_personer_unike?: number
  created_at: string
  updated_at: string
  created_by?: string
}

export interface PayrollSummary {
  antVirks: number
  antMott: number
  bruttolonn: number
  trekkPerson: number
  trekkInns: number
  agaInns: number
  soner: Record<string, { grunnlag: number; sats?: number | null; belop?: number }>
  antPInn?: number
  antPUni?: number
  afAktive: number
  afNye: number
  afSlutt: number
}

export function usePayrollImports() {
  const { selectedClientId } = useFiscalYear()
  
  return useQuery({
    queryKey: ['payroll-imports', selectedClientId],
    queryFn: async () => {
      if (!selectedClientId) return []
      
      const { data, error } = await supabase
        .from('payroll_imports')
        .select('*')
        .eq('client_id', selectedClientId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as PayrollImport[]
    },
    enabled: !!selectedClientId
  })
}

export function usePayrollSummary(importId?: string) {
  return useQuery({
    queryKey: ['payroll-summary', importId],
    queryFn: async () => {
      if (!importId) return null
      
      // Fetch variables for this import
      const { data: variables, error } = await supabase
        .from('payroll_variables')
        .select('name, value')
        .eq('import_id', importId)
      
      if (error) throw error
      
      // Convert variables array to object
      const vars: Record<string, any> = {}
      variables.forEach(v => {
        vars[v.name] = typeof v.value === 'string' ? JSON.parse(v.value) : v.value
      })
      
      return {
        antVirks: vars['antall.virksomheter'] ?? 0,
        antMott: vars['antall.mottakere'] ?? 0,
        bruttolonn: vars['sum.bruttolonn'] ?? 0,
        trekkPerson: vars['sum.forskuddstrekk.person'] ?? 0,
        trekkInns: vars['sum.forskuddstrekk.innsendinger'] ?? 0,
        agaInns: vars['sum.aga.innsendinger'] ?? 0,
        soner: vars['aga.soner'] ?? {},
        antPInn: vars['opp.sum.antallPersonerInnrapportert'],
        antPUni: vars['opp.sum.antallPersonerUnike'],
        afAktive: vars['antall.af.aktive'] ?? 0,
        afNye: vars['antall.af.nye'] ?? 0,
        afSlutt: vars['antall.af.sluttede'] ?? 0,
      } as PayrollSummary
    },
    enabled: !!importId
  })
}

export function useCreatePayrollImport() {
  const queryClient = useQueryClient()
  const { selectedClientId } = useFiscalYear()
  
  return useMutation({
    mutationFn: async (data: {
      period_key: string
      file_name?: string
      payrollData: any
    }) => {
      if (!selectedClientId) throw new Error('No client selected')
      
      // Call the import edge function
      const { data: result, error } = await supabase.functions.invoke('import-payroll', {
        body: {
          client_id: selectedClientId,
          period_key: data.period_key,
          file_name: data.file_name,
          payroll_data: data.payrollData
        }
      })
      
      if (error) throw error
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-imports', selectedClientId] })
    }
  })
}

export function useDeletePayrollImport() {
  const queryClient = useQueryClient()
  const { selectedClientId } = useFiscalYear()
  
  return useMutation({
    mutationFn: async (importId: string) => {
      const { error } = await supabase
        .from('payroll_imports')
        .delete()
        .eq('id', importId)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-imports', selectedClientId] })
    }
  })
}