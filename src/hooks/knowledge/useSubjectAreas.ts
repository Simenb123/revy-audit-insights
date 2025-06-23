
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SubjectArea {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  icon?: string;
  color: string;
  sort_order: number;
  is_active: boolean;
  parent_subject_area_id?: string;
  created_at: string;
  updated_at: string;
  children?: SubjectArea[];
  parent?: Partial<SubjectArea>;
}

// Build hierarchical structure from flat array
const buildHierarchy = (areas: SubjectArea[]): SubjectArea[] => {
  const areaMap = new Map<string, SubjectArea>();
  const rootAreas: SubjectArea[] = [];

  // First pass: create map and initialize children arrays
  areas.forEach(area => {
    areaMap.set(area.id, { ...area, children: [] });
  });

  // Second pass: build hierarchy
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

  // Sort root areas and their children
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
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useSubjectAreasFlat = () => {
  return useSubjectAreas(false);
};

export const useSubjectAreasHierarchical = () => {
  return useSubjectAreas(true);
};

export const useSubjectAreaById = (id: string) => {
  return useQuery({
    queryKey: ['subject-area', id],
    queryFn: async (): Promise<SubjectArea | null> => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('subject_areas')
        .select(`
          *,
          parent:parent_subject_area_id (
            id,
            name,
            display_name
          ),
          children:subject_areas!parent_subject_area_id (
            id,
            name,
            display_name,
            icon,
            color,
            sort_order
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching subject area:', error);
        throw error;
      }

      return {
        ...data,
        parent: data.parent ? {
          id: data.parent.id,
          name: data.parent.name,
          display_name: data.parent.display_name
        } : undefined,
        children: data.children || []
      } as SubjectArea;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useCreateSubjectArea = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (subjectArea: Omit<SubjectArea, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('subject_areas')
        .insert(subjectArea)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subject-areas'] });
      toast.success('Emneområde opprettet');
    },
    onError: (error: any) => {
      toast.error('Feil ved opprettelse: ' + error.message);
    }
  });
};

export const useUpdateSubjectArea = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SubjectArea> & { id: string }) => {
      const { data, error } = await supabase
        .from('subject_areas')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subject-areas'] });
      toast.success('Emneområde oppdatert');
    },
    onError: (error: any) => {
      toast.error('Feil ved oppdatering: ' + error.message);
    }
  });
};

export const useDeleteSubjectArea = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('subject_areas')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subject-areas'] });
      toast.success('Emneområde slettet');
    },
    onError: (error: any) => {
      toast.error('Feil ved sletting: ' + error.message);
    }
  });
};
