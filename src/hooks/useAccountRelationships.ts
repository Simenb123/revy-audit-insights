import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Audit Areas
export const useAuditAreas = () => {
  return useQuery({
    queryKey: ['audit-areas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_areas')
        .select('*')
        .eq('is_active', true)
        .order('sort_order, audit_number');

      if (error) throw error;
      return data;
    }
  });
};

export const useCreateAuditArea = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (auditArea: {
      audit_number: number;
      name: string;
      description?: string;
      color?: string;
    }) => {
      const { data, error } = await supabase
        .from('audit_areas')
        .insert(auditArea)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-areas'] });
      toast.success('Revisjonsområde opprettet');
    },
    onError: (error) => {
      console.error('Error creating audit area:', error);
      toast.error('Feil ved opprettelse av revisjonsområde');
    }
  });
};

// Risk Factors
export const useRiskFactors = () => {
  return useQuery({
    queryKey: ['risk-factors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('risk_factors')
        .select('*')
        .eq('is_active', true)
        .order('sort_order, risk_number');

      if (error) throw error;
      return data;
    }
  });
};

export const useCreateRiskFactor = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (riskFactor: {
      risk_number: number;
      name: string;
      description?: string;
      risk_category?: string;
      risk_level?: string;
    }) => {
      const { data, error } = await supabase
        .from('risk_factors')
        .insert(riskFactor)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risk-factors'] });
      toast.success('Risikofaktor opprettet');
    },
    onError: (error) => {
      console.error('Error creating risk factor:', error);
      toast.error('Feil ved opprettelse av risikofaktor');
    }
  });
};

// Account Audit Area Mappings
export const useAccountAuditAreaMappings = (standardAccountId?: string) => {
  return useQuery({
    queryKey: ['account-audit-area-mappings', standardAccountId],
    queryFn: async () => {
      let query = supabase
        .from('standard_account_audit_area_mappings')
        .select(`
          *,
          audit_areas(audit_number, name, color),
          standard_accounts(standard_number, standard_name)
        `);

      if (standardAccountId) {
        query = query.eq('standard_account_id', standardAccountId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!standardAccountId || standardAccountId === undefined
  });
};

export const useCreateAccountAuditAreaMapping = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (mapping: {
      standard_account_id: string;
      audit_area_id: string;
      is_primary?: boolean;
      relevance_score?: number;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('standard_account_audit_area_mappings')
        .insert(mapping)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-audit-area-mappings'] });
      toast.success('Kobling til revisjonsområde opprettet');
    },
    onError: (error) => {
      console.error('Error creating account audit area mapping:', error);
      toast.error('Feil ved opprettelse av kobling');
    }
  });
};

// Account Risk Mappings
export const useAccountRiskMappings = (standardAccountId?: string) => {
  return useQuery({
    queryKey: ['account-risk-mappings', standardAccountId],
    queryFn: async () => {
      let query = supabase
        .from('account_risk_mappings')
        .select(`
          *,
          risk_factors(risk_number, name, risk_level, risk_category),
          standard_accounts(standard_number, standard_name)
        `);

      if (standardAccountId) {
        query = query.eq('standard_account_id', standardAccountId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!standardAccountId || standardAccountId === undefined
  });
};

export const useCreateAccountRiskMapping = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (mapping: {
      standard_account_id: string;
      risk_factor_id: string;
      risk_level?: string;
      impact_description?: string;
      mitigation_notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('account_risk_mappings')
        .insert(mapping)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-risk-mappings'] });
      toast.success('Risikokobling opprettet');
    },
    onError: (error) => {
      console.error('Error creating account risk mapping:', error);
      toast.error('Feil ved opprettelse av risikokobling');
    }
  });
};

// Related Party Indicators
export const useRelatedPartyIndicators = (standardAccountId?: string) => {
  return useQuery({
    queryKey: ['related-party-indicators', standardAccountId],
    queryFn: async () => {
      let query = supabase
        .from('related_party_indicators')
        .select(`
          *,
          standard_accounts(standard_number, standard_name)
        `);

      if (standardAccountId) {
        query = query.eq('standard_account_id', standardAccountId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!standardAccountId || standardAccountId === undefined
  });
};

export const useUpsertRelatedPartyIndicator = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (indicator: {
      standard_account_id: string;
      is_related_party: boolean;
      indicator_type?: string;
      description?: string;
      disclosure_requirements?: string;
    }) => {
      const { data, error } = await supabase
        .from('related_party_indicators')
        .upsert(indicator, {
          onConflict: 'standard_account_id'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['related-party-indicators'] });
      toast.success('Nærstående transaksjon indikator oppdatert');
    },
    onError: (error) => {
      console.error('Error updating related party indicator:', error);
      toast.error('Feil ved oppdatering av nærstående transaksjon indikator');
    }
  });
};

// Estimate Indicators
export const useEstimateIndicators = (standardAccountId?: string) => {
  return useQuery({
    queryKey: ['estimate-indicators', standardAccountId],
    queryFn: async () => {
      let query = supabase
        .from('estimate_indicators')
        .select(`
          *,
          standard_accounts(standard_number, standard_name)
        `);

      if (standardAccountId) {
        query = query.eq('standard_account_id', standardAccountId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!standardAccountId || standardAccountId === undefined
  });
};

export const useUpsertEstimateIndicator = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (indicator: {
      standard_account_id: string;
      is_estimate: boolean;
      estimate_type?: string;
      complexity_level?: string;
      estimation_method?: string;
      key_assumptions?: string;
      sensitivity_analysis_required?: boolean;
      audit_considerations?: string;
    }) => {
      const { data, error } = await supabase
        .from('estimate_indicators')
        .upsert(indicator, {
          onConflict: 'standard_account_id'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimate-indicators'] });
      toast.success('Estimat indikator oppdatert');
    },
    onError: (error) => {
      console.error('Error updating estimate indicator:', error);
      toast.error('Feil ved oppdatering av estimat indikator');
    }
  });
};

// Custom Attributes
export const useCustomAttributes = (standardAccountId?: string) => {
  return useQuery({
    queryKey: ['custom-attributes', standardAccountId],
    queryFn: async () => {
      let query = supabase
        .from('account_custom_attributes')
        .select(`
          *,
          standard_accounts(standard_number, standard_name)
        `);

      if (standardAccountId) {
        query = query.eq('standard_account_id', standardAccountId);
      }

      const { data, error } = await query.order('attribute_name');

      if (error) throw error;
      return data;
    },
    enabled: !!standardAccountId || standardAccountId === undefined
  });
};

export const useUpsertCustomAttribute = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (attribute: {
      standard_account_id: string;
      attribute_name: string;
      attribute_value: string;
      attribute_type?: string;
    }) => {
      const { data, error } = await supabase
        .from('account_custom_attributes')
        .upsert(attribute, {
          onConflict: 'standard_account_id,attribute_name'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-attributes'] });
      toast.success('Egendefinert attributt oppdatert');
    },
    onError: (error) => {
      console.error('Error updating custom attribute:', error);
      toast.error('Feil ved oppdatering av egendefinert attributt');
    }
  });
};

// Import/Export History
export const useImportExportHistory = () => {
  return useQuery({
    queryKey: ['import-export-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('data_import_exports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    }
  });
};