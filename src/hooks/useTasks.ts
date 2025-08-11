
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'on_hold' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  client_id: string;
  team_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string | null;
  created_by: string | null;
  due_date: string | null; // date
  estimated_hours: number;
  remaining_hours: number | null;
  tags: string[];
  checklist: any[];
  completed_at: string | null; // timestamptz
  created_at: string;
  updated_at: string;
}

export interface UseTasksFilter {
  clientId?: string;
  teamId?: string;
  assigneeId?: string;
  status?: TaskStatus;
}

export const useTasks = (filter: UseTasksFilter) => {
  const { clientId, teamId, assigneeId, status } = filter;

  return useQuery({
    queryKey: ['tasks', clientId, teamId, assigneeId, status],
    queryFn: async (): Promise<Task[]> => {
      // any-cast until generated types include tables
      let query = (supabase as any).from('tasks' as any).select('*');

      if (clientId) query = query.eq('client_id', clientId);
      if (teamId) query = query.eq('team_id', teamId);
      if (assigneeId) query = query.eq('assignee_id', assigneeId);
      if (status) query = query.eq('status', status);

      query = query.order('priority', { ascending: false }).order('due_date', { ascending: true }).order('updated_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Task[];
    },
    enabled: !!(clientId || teamId || assigneeId),
    staleTime: 1000 * 30,
  });
};

export interface UpsertTaskInput {
  id?: string;
  client_id: string;
  team_id?: string | null;
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee_id?: string | null;
  created_by: string; // IMPORTANT: must be auth.uid() for RLS
  due_date?: string | null; // YYYY-MM-DD
  estimated_hours?: number;
  remaining_hours?: number | null;
  tags?: string[];
  checklist?: any[];
  completed_at?: string | null;
}

export const useUpsertTask = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpsertTaskInput) => {
      const payload = { 
        status: 'todo',
        priority: 'medium',
        tags: [],
        checklist: [],
        estimated_hours: 0,
        ...input,
      } as any;

      const { data, error } = await (supabase as any)
        .from('tasks' as any)
        .upsert(payload)
        .select('*')
        .single();

      if (error) throw error;
      return data as Task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({ title: 'Oppgave lagret', description: 'Oppgaven ble lagret.' });
    },
    onError: (err: any) => {
      toast({ title: 'Kunne ikke lagre oppgave', description: err.message, variant: 'destructive' });
    },
  });
};

export const useDeleteTask = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await (supabase as any)
        .from('tasks' as any)
        .delete()
        .eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({ title: 'Oppgave slettet', description: 'Oppgaven ble slettet.' });
    },
    onError: (err: any) => {
      toast({ title: 'Kunne ikke slette oppgave', description: err.message, variant: 'destructive' });
    },
  });
};
