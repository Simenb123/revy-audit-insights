
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  ISAStandard, 
  DocumentRequirement, 
  WorkingPaperTemplate, 
  EnhancedAuditActionTemplate,
  AuditActionISAMapping,
  AuditActionDocumentMapping,
  ActionAIMetadata
} from '@/types/enhanced-audit-actions';

export function useISAStandards() {
  return useQuery({
    queryKey: ['isa-standards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('isa_standards')
        .select('*')
        .eq('is_active', true)
        .order('isa_number');

      if (error) {
        console.error('Error fetching ISA standards:', error);
        throw error;
      }

      return data as ISAStandard[];
    }
  });
}

export function useDocumentRequirements(subjectArea?: string) {
  return useQuery({
    queryKey: ['document-requirements', subjectArea],
    queryFn: async () => {
      let query = supabase
        .from('document_requirements')
        .select('*')
        .order('name');

      if (subjectArea) {
        query = query.eq('subject_area', subjectArea);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching document requirements:', error);
        throw error;
      }

      return data as DocumentRequirement[];
    }
  });
}

export function useWorkingPaperTemplates(subjectArea?: string, actionType?: string) {
  return useQuery({
    queryKey: ['working-paper-templates', subjectArea, actionType],
    queryFn: async () => {
      let query = supabase
        .from('working_paper_templates')
        .select('*')
        .order('name');

      if (subjectArea) {
        query = query.eq('subject_area', subjectArea);
      }
      if (actionType) {
        query = query.eq('action_type', actionType);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching working paper templates:', error);
        throw error;
      }

      return data as WorkingPaperTemplate[];
    }
  });
}

export function useEnhancedAuditActionTemplates() {
  return useQuery({
    queryKey: ['enhanced-audit-action-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_action_templates')
        .select(`
          *,
          isa_mappings:audit_action_isa_mappings(
            *,
            isa_standard:isa_standards(*)
          ),
          document_mappings:audit_action_document_mappings(
            *,
            document_requirement:document_requirements(*)
          ),
          ai_metadata:action_ai_metadata(*)
        `)
        .order('subject_area, sort_order');

      if (error) {
        console.error('Error fetching enhanced audit action templates:', error);
        throw error;
      }

      return data as EnhancedAuditActionTemplate[];
    }
  });
}

export function useActionISAMappings(actionTemplateId?: string) {
  return useQuery({
    queryKey: ['action-isa-mappings', actionTemplateId],
    queryFn: async () => {
      if (!actionTemplateId) return [];

      const { data, error } = await supabase
        .from('audit_action_isa_mappings')
        .select(`
          *,
          isa_standard:isa_standards(*)
        `)
        .eq('action_template_id', actionTemplateId)
        .order('relevance_level');

      if (error) {
        console.error('Error fetching action ISA mappings:', error);
        throw error;
      }

      return data as AuditActionISAMapping[];
    },
    enabled: !!actionTemplateId
  });
}

export function useActionDocumentMappings(actionTemplateId?: string) {
  return useQuery({
    queryKey: ['action-document-mappings', actionTemplateId],
    queryFn: async () => {
      if (!actionTemplateId) return [];

      const { data, error } = await supabase
        .from('audit_action_document_mappings')
        .select(`
          *,
          document_requirement:document_requirements(*)
        `)
        .eq('action_template_id', actionTemplateId)
        .order('timing, is_mandatory desc');

      if (error) {
        console.error('Error fetching action document mappings:', error);
        throw error;
      }

      return data as AuditActionDocumentMapping[];
    },
    enabled: !!actionTemplateId
  });
}

export function useActionAIMetadata(actionTemplateId?: string) {
  return useQuery({
    queryKey: ['action-ai-metadata', actionTemplateId],
    queryFn: async () => {
      if (!actionTemplateId) return null;

      const { data, error } = await supabase
        .from('action_ai_metadata')
        .select('*')
        .eq('action_template_id', actionTemplateId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching action AI metadata:', error);
        throw error;
      }

      return data as ActionAIMetadata | null;
    },
    enabled: !!actionTemplateId
  });
}

export function useCreateActionISAMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mapping: Omit<AuditActionISAMapping, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('audit_action_isa_mappings')
        .insert(mapping)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['action-isa-mappings', variables.action_template_id] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-audit-action-templates'] });
      toast({
        title: "ISA-standard koblet",
        description: "ISA-standarden er nå koblet til handlingen.",
      });
    },
    onError: (error) => {
      console.error('Error creating action ISA mapping:', error);
      toast({
        title: "Feil ved kobling",
        description: "Kunne ikke koble ISA-standarden til handlingen.",
        variant: "destructive",
      });
    }
  });
}

export function useCreateActionDocumentMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mapping: Omit<AuditActionDocumentMapping, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('audit_action_document_mappings')
        .insert(mapping)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['action-document-mappings', variables.action_template_id] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-audit-action-templates'] });
      toast({
        title: "Dokumentkrav koblet",
        description: "Dokumentkravet er nå koblet til handlingen.",
      });
    },
    onError: (error) => {
      console.error('Error creating action document mapping:', error);
      toast({
        title: "Feil ved kobling",
        description: "Kunne ikke koble dokumentkravet til handlingen.",
        variant: "destructive",
      });
    }
  });
}

export function useCreateActionAIMetadata() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (metadata: Omit<ActionAIMetadata, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('action_ai_metadata')
        .insert(metadata)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['action-ai-metadata', variables.action_template_id] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-audit-action-templates'] });
      toast({
        title: "AI-metadata opprettet",
        description: "AI-metadata for handlingen er opprettet.",
      });
    },
    onError: (error) => {
      console.error('Error creating action AI metadata:', error);
      toast({
        title: "Feil ved opprettelse",
        description: "Kunne ikke opprette AI-metadata.",
        variant: "destructive",
      });
    }
  });
}
