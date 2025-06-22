
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
  created_at: string;
  updated_at: string;
}

export const useSubjectAreas = () => {
  return useQuery({
    queryKey: ['subject-areas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subject_areas')
        .select('*')
        .eq('is_active', true)
        .order('sort_order, display_name');
      
      if (error) throw error;
      return data as SubjectArea[];
    }
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
