
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { AuditSubjectArea } from '@/types/audit-actions';

export const useSubjectAreasWithCounts = () => {
  return useQuery({
    queryKey: ['subject-areas-with-counts'],
    queryFn: async () => {
      // Get all subject areas
      const { data: subjectAreas, error: subjectAreasError } = await supabase
        .from('subject_areas')
        .select('*')
        .eq('is_active', true)
        .order('sort_order, display_name');

      if (subjectAreasError) throw subjectAreasError;

      // Get counts for each subject area
      const areasWithCounts = await Promise.all(
        subjectAreas.map(async (area) => {
          // Map the subject area name to the enum value if possible
          const mappedSubjectArea = mapSubjectAreaName(area.name);
          
          let actionCount = 0;
          if (mappedSubjectArea) {
            // Count audit action templates
            const { count: actionCountResult, error: actionError } = await supabase
              .from('audit_action_templates')
              .select('*', { count: 'exact', head: true })
              .eq('subject_area', mappedSubjectArea)
              .eq('is_active', true);

            if (actionError) throw actionError;
            actionCount = actionCountResult || 0;
          }

          // Count articles related to this subject area
          const { count: articleCount, error: articleError } = await supabase
            .from('article_subject_areas')
            .select('*', { count: 'exact', head: true })
            .eq('subject_area_id', area.id);

          if (articleError) throw articleError;

          return {
            ...area,
            action_count: actionCount,
            article_count: articleCount || 0
          };
        })
      );

      return areasWithCounts;
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
