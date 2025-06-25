import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import createTaxonomyHooks from './useTaxonomy';
import type { SubjectArea } from '@/types/classification';


// Build hierarchical structure from flat array
const buildHierarchy = (areas: SubjectArea[]): SubjectArea[] => {
  const areaMap = new Map<string, SubjectArea>();
  const rootAreas: SubjectArea[] = [];

  areas.forEach(area => {
    areaMap.set(area.id, { ...area, children: [] });
  });

  areas.forEach(area => {
    const areaWithChildren = areaMap.get(area.id)!;

    if (area.parent_subject_area_id) {
      const parent = areaMap.get(area.parent_subject_area_id);
      if (parent) {
        parent.children!.push(areaWithChildren);
        areaWithChildren.parent = parent;
      } else {
        rootAreas.push(areaWithChildren);
      }
    } else {
      rootAreas.push(areaWithChildren);
    }
  });

  const sortAreas = (areas: SubjectArea[]) => {
    areas.sort((a, b) => a.sort_order - b.sort_order);
    areas.forEach(area => {
      if (area.children) {
        sortAreas(area.children);
      }
    });
  };

  sortAreas(rootAreas);
  return rootAreas;
};

export const useSubjectAreas = (hierarchical: boolean = false) => {
  return useQuery({
    queryKey: ['subject-areas', hierarchical],
    queryFn: async (): Promise<SubjectArea[]> => {
      const { data, error } = await supabase
        .from('subject_areas')
        .select(`
          *,
          parent:parent_subject_area_id (
            id,
            name,
            display_name
          )
        `)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching subject areas:', error);
        throw error;
      }

      const areas = (data || []).map(area => ({
        ...area,
        parent: area.parent ? {
          id: area.parent.id,
          name: area.parent.name,
          display_name: area.parent.display_name
        } : undefined
      })) as SubjectArea[];

      if (hierarchical) {
        return buildHierarchy(areas);
      }

      return areas;
    },
    staleTime: 1000 * 60 * 10,
  });
};

export const useSubjectAreasFlat = () => useSubjectAreas(false);
export const useSubjectAreasHierarchical = () => useSubjectAreas(true);

const {
  useTaxonomyById: useSubjectAreaById,
  useCreateTaxonomy: useCreateSubjectArea,
  useUpdateTaxonomy: useUpdateSubjectArea,
  useDeleteTaxonomy: useDeleteSubjectArea,
} = createTaxonomyHooks<SubjectArea>('subject_areas', 'Emneområde');

export {
  useSubjectAreaById,
  useCreateSubjectArea,
  useUpdateSubjectArea,
  useDeleteSubjectArea,
};

export type { SubjectArea };
