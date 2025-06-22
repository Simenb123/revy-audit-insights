
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { AuditSubjectArea } from '@/types/audit-actions';

export const useAuditActionTemplatesPreview = (subjectArea?: string, limit = 5) => {
  return useQuery({
    queryKey: ['audit-action-templates-preview', subjectArea, limit],
    queryFn: async () => {
      let query = supabase
        .from('audit_action_templates')
        .select(`
          id,
          name,
          description,
          subject_area,
          action_type,
          risk_level,
          estimated_hours,
          is_system_template
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (subjectArea) {
        // Map the subject area name to enum value
        const mappedSubjectArea = mapSubjectAreaName(subjectArea);
        if (mappedSubjectArea) {
          query = query.eq('subject_area', mappedSubjectArea);
        } else {
          // If no mapping found, return empty array
          return [];
        }
      }

      query = query.limit(limit);

      const { data, error } = await query;

      if (error) throw error;
      return data;
    }
  });
};

export const useAuditActionTemplateCount = () => {
  return useQuery({
    queryKey: ['audit-action-template-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('audit_action_templates')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (error) throw error;
      return count || 0;
    }
  });
};

// Helper function to map subject area names to enum values
function mapSubjectAreaName(name: string): AuditSubjectArea | null {
  const mapping: Record<string, AuditSubjectArea> = {
    'Salg': 'sales',
    'Sales': 'sales',
    'Lønn': 'payroll',
    'Payroll': 'payroll',
    'Driftskostnader': 'operating_expenses',
    'Operating Expenses': 'operating_expenses',
    'Varelager': 'inventory',
    'Inventory': 'inventory',
    'Finans': 'finance',
    'Finance': 'finance',
    'Bank': 'banking',
    'Banking': 'banking',
    'Anleggsmidler': 'fixed_assets',
    'Fixed Assets': 'fixed_assets',
    'Kundefordringer': 'receivables',
    'Receivables': 'receivables',
    'Leverandørgjeld': 'payables',
    'Payables': 'payables',
    'Egenkapital': 'equity',
    'Equity': 'equity',
    'Annet': 'other',
    'Other': 'other'
  };

  return mapping[name] || null;
}
