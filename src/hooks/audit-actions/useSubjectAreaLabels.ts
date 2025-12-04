import { useMemo } from 'react';
import { useSubjectAreas } from '@/hooks/knowledge/useSubjectAreas';

/**
 * Hook for getting dynamic subject area labels from the database.
 * Replaces hardcoded SUBJECT_AREA_LABELS with database-driven values.
 * 
 * @example
 * ```tsx
 * const { getLabel, options, isLoading } = useSubjectAreaLabels();
 * console.log(getLabel('revenue')); // "Salgsinntekter"
 * ```
 * 
 * @returns Object with labelMap, options for select dropdowns, getLabel function, and loading state
 */
export function useSubjectAreaLabels() {
  const { data: subjectAreas, isLoading } = useSubjectAreas();

  const labelMap = useMemo(() => {
    if (!subjectAreas) return {};
    
    return subjectAreas.reduce((acc, area) => {
      acc[area.name] = area.display_name;
      return acc;
    }, {} as Record<string, string>);
  }, [subjectAreas]);

  const options = useMemo(() => {
    if (!subjectAreas) return [];
    
    return subjectAreas
      .filter(area => area.is_active)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      .map(area => ({
        value: area.id,
        label: area.display_name,
        icon: area.icon,
        color: area.color
      }));
  }, [subjectAreas]);

  const getLabel = (name: string): string => {
    return labelMap[name] || name;
  };

  return {
    labelMap,
    options,
    getLabel,
    isLoading
  };
}
