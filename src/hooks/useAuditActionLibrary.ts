import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Types for the new audit action library system
export interface AuditActionAreaMapping {
  id: string;
  action_template_id: string;
  audit_area_id: string;
  relevance_level: 'primary' | 'secondary' | 'optional';
  sort_order: number;
  created_at: string;
}

export interface AuditActionRiskMapping {
  id: string;
  action_template_id: string;
  risk_factor_id: string;
  effectiveness_level: 'low' | 'medium' | 'high';
  response_type: 'control_test' | 'substantive' | 'both';
  created_at: string;
}

export interface AuditActionContext {
  id: string;
  action_template_id: string;
  context_name: string;
  context_description?: string;
  modified_procedures: string;
  modified_documentation_requirements?: string;
  estimated_hours_adjustment: number;
  risk_level_adjustment?: 'increase' | 'decrease' | 'maintain';
  applicable_conditions: any[];
  created_at: string;
  updated_at: string;
}

export interface ClientRiskAssessment {
  id: string;
  client_id: string;
  audit_area_id: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  risk_factors: any[];
  assessment_notes?: string;
  assessed_by?: string;
  assessment_date: string;
  created_at: string;
  updated_at: string;
}

export interface AuditActionRecommendation {
  id: string;
  client_id: string;
  action_template_id: string;
  risk_assessment_id: string;
  recommendation_score: number;
  reasoning?: string;
  ai_metadata: any;
  status: 'pending' | 'accepted' | 'rejected' | 'modified';
  created_at: string;
  updated_at: string;
}

// Hook for fetching audit action area mappings
export const useAuditActionAreaMappings = (areaId?: string) => {
  return useQuery({
    queryKey: ['audit-action-area-mappings', areaId],
    queryFn: async () => {
      let query = supabase
        .from('audit_action_area_mappings')
        .select(`
          *,
          audit_action_templates (
            id,
            name,
            description,
            subject_area,
            action_type,
            risk_level,
            estimated_hours
          ),
          audit_areas (
            id,
            name,
            audit_number,
            description
          )
        `);

      if (areaId) {
        query = query.eq('audit_area_id', areaId);
      }

      const { data, error } = await query.order('sort_order');

      if (error) throw error;
      return data as (AuditActionAreaMapping & {
        audit_action_templates: any;
        audit_areas: any;
      })[];
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Hook for creating audit action area mappings
export const useCreateAuditActionAreaMapping = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (mapping: Omit<AuditActionAreaMapping, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('audit_action_area_mappings')
        .insert(mapping)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-action-area-mappings'] });
      toast({
        title: 'Mapping opprettet',
        description: 'Revisjonshandling ble knyttet til område.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Feil',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Hook for fetching audit action risk mappings
export const useAuditActionRiskMappings = (riskFactorId?: string) => {
  return useQuery({
    queryKey: ['audit-action-risk-mappings', riskFactorId],
    queryFn: async () => {
      let query = supabase
        .from('audit_action_risk_mappings')
        .select(`
          *,
          audit_action_templates (
            id,
            name,
            description,
            subject_area,
            action_type,
            risk_level
          ),
          risk_factors (
            id,
            name,
            description,
            category
          )
        `);

      if (riskFactorId) {
        query = query.eq('risk_factor_id', riskFactorId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as (AuditActionRiskMapping & {
        audit_action_templates: any;
        risk_factors: any;
      })[];
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Hook for creating audit action risk mappings
export const useCreateAuditActionRiskMapping = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (mapping: Omit<AuditActionRiskMapping, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('audit_action_risk_mappings')
        .insert(mapping)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-action-risk-mappings'] });
      toast({
        title: 'Risikokartlegging opprettet',
        description: 'Revisjonshandling ble knyttet til risikofaktor.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Feil',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Hook for fetching client risk assessments
export const useClientRiskAssessments = (clientId: string) => {
  return useQuery({
    queryKey: ['client-risk-assessments', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_risk_assessments')
        .select(`
          *,
          audit_areas (
            id,
            name,
            audit_number,
            description
          )
        `)
        .eq('client_id', clientId)
        .order('assessment_date', { ascending: false });

      if (error) throw error;
      return data as (ClientRiskAssessment & {
        audit_areas: any;
      })[];
    },
    staleTime: 2 * 60 * 1000,
  });
};

// Hook for creating client risk assessments
export const useCreateClientRiskAssessment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (assessment: Omit<ClientRiskAssessment, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('client_risk_assessments')
        .insert(assessment)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-risk-assessments'] });
      toast({
        title: 'Risikovurdering opprettet',
        description: 'Ny risikovurdering ble lagret.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Feil',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Hook for fetching audit action recommendations for a client
export const useAuditActionRecommendations = (clientId: string) => {
  return useQuery({
    queryKey: ['audit-action-recommendations', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_action_recommendations')
        .select(`
          *,
          audit_action_templates (
            id,
            name,
            description,
            subject_area,
            action_type,
            procedures,
            estimated_hours
          ),
          client_risk_assessments (
            id,
            risk_level,
            assessment_notes,
            audit_areas (
              name,
              audit_number
            )
          )
        `)
        .eq('client_id', clientId)
        .order('recommendation_score', { ascending: false });

      if (error) throw error;
      return data as (AuditActionRecommendation & {
        audit_action_templates: any;
        client_risk_assessments: any;
      })[];
    },
    staleTime: 2 * 60 * 1000,
  });
};

// Hook for updating recommendation status
export const useUpdateRecommendationStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      id, 
      status 
    }: { 
      id: string; 
      status: 'pending' | 'accepted' | 'rejected' | 'modified';
    }) => {
      const { data, error } = await supabase
        .from('audit_action_recommendations')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-action-recommendations'] });
      toast({
        title: 'Status oppdatert',
        description: 'Anbefaling status ble endret.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Feil',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Hook for fetching actions by audit area
export const useAuditActionsByArea = (areaId: string) => {
  return useQuery({
    queryKey: ['audit-actions-by-area', areaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_action_area_mappings')
        .select(`
          *,
          audit_action_templates (
            id,
            name,
            description,
            subject_area,
            action_type,
            procedures,
            documentation_requirements,
            estimated_hours,
            risk_level,
            applicable_phases
          )
        `)
        .eq('audit_area_id', areaId)
        .order('relevance_level')
        .order('sort_order');

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
};