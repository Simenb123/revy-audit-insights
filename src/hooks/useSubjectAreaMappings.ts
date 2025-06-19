
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SubjectAreaMapping {
  id: string;
  document_category_id: string;
  subject_area: string;
  isa_standards: string[];
  audit_phases: string[];
  risk_level: 'low' | 'medium' | 'high';
  confidence_score: number;
}

export const useSubjectAreaMappings = () => {
  const [mappings, setMappings] = useState<SubjectAreaMapping[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMappings();
  }, []);

  const loadMappings = async () => {
    try {
      const { data, error } = await supabase
        .from('document_category_subject_area_mappings')
        .select('*');
      
      if (error) throw error;
      setMappings(data || []);
    } catch (error) {
      console.error('Error loading subject area mappings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMappingForCategory = (categoryId: string): SubjectAreaMapping | null => {
    return mappings.find(m => m.document_category_id === categoryId) || null;
  };

  const getISAStandardsForSubjectArea = (subjectArea: string): string[] => {
    const mapping = mappings.find(m => m.subject_area === subjectArea);
    return mapping?.isa_standards || [];
  };

  const getAuditPhasesForSubjectArea = (subjectArea: string): string[] => {
    const mapping = mappings.find(m => m.subject_area === subjectArea);
    return mapping?.audit_phases || [];
  };

  const getRiskLevelForSubjectArea = (subjectArea: string): string => {
    const mapping = mappings.find(m => m.subject_area === subjectArea);
    return mapping?.risk_level || 'medium';
  };

  return {
    mappings,
    isLoading,
    getMappingForCategory,
    getISAStandardsForSubjectArea,
    getAuditPhasesForSubjectArea,
    getRiskLevelForSubjectArea,
    loadMappings
  };
};
