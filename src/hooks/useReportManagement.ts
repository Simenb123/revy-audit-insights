import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type ReportTemplate = Database['public']['Tables']['report_templates']['Row'];
type GeneratedReport = Database['public']['Tables']['generated_reports']['Row'];
type AuditWorkingPaper = Database['public']['Tables']['audit_working_papers']['Row'];
type DocumentationChecklist = Database['public']['Tables']['documentation_checklists']['Row'];

interface ReportGenerationParams {
  template_id: string;
  period_start: string;
  period_end: string;
  parameters?: Record<string, any>;
}

interface WorkingPaperFormData {
  paper_reference: string;
  paper_title: string;
  audit_area?: string;
  paper_type: 'lead_schedule' | 'detail_testing' | 'analytical_review' | 'walkthrough' | 'control_testing' | 'substantive_testing' | 'summary' | 'memo';
  period_year: number;
  content?: Record<string, any>;
  conclusion?: string;
  risk_level?: 'low' | 'medium' | 'high';
  estimated_hours?: number;
  materiality_threshold?: number;
}

interface ChecklistFormData {
  checklist_name: string;
  checklist_type: 'audit_completion' | 'file_review' | 'quality_control' | 'tax_compliance' | 'year_end' | 'interim';
  audit_year: number;
  checklist_data: Array<{
    id: string;
    description: string;
    completed: boolean;
    notes?: string;
  }>;
  due_date?: string;
  notes?: string;
}

interface ReportSummary {
  total_reports: number;
  completed_reports: number;
  draft_reports: number;
  failed_reports: number;
  reports_this_month: number;
  by_template: Record<string, number>;
}

export function useReportManagement(clientId: string) {
  const queryClient = useQueryClient();

  // Fetch report templates
  const {
    data: reportTemplates,
    isLoading: templatesLoading
  } = useQuery({
    queryKey: ['reportTemplates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('report_templates')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return data;
    }
  });

  // Fetch generated reports for client
  const {
    data: generatedReports,
    isLoading: reportsLoading
  } = useQuery({
    queryKey: ['generatedReports', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('generated_reports')
        .select(`
          *,
          report_templates (
            name,
            category
          )
        `)
        .eq('client_id', clientId)
        .order('generation_date', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!clientId
  });

  // Fetch report summary
  const {
    data: reportSummary,
    isLoading: summaryLoading
  } = useQuery<ReportSummary>({
    queryKey: ['reportSummary', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_reports_summary', { p_client_id: clientId });

      if (error) throw error;
      return data as unknown as ReportSummary;
    },
    enabled: !!clientId
  });

  // Generate report mutation
  const generateReportMutation = useMutation({
    mutationFn: async (params: ReportGenerationParams & { client_id: string }) => {
      const { data, error } = await supabase
        .rpc('generate_client_financial_report', {
          p_client_id: params.client_id,
          p_template_id: params.template_id,
          p_period_start: params.period_start,
          p_period_end: params.period_end,
          p_parameters: params.parameters || {}
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generatedReports', clientId] });
      queryClient.invalidateQueries({ queryKey: ['reportSummary', clientId] });
    }
  });

  // Delete report mutation
  const deleteReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const { error } = await supabase
        .from('generated_reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generatedReports', clientId] });
      queryClient.invalidateQueries({ queryKey: ['reportSummary', clientId] });
    }
  });

  return {
    reportTemplates,
    templatesLoading,
    generatedReports,
    reportsLoading,
    reportSummary,
    summaryLoading,
    generateReport: (params: ReportGenerationParams) => 
      generateReportMutation.mutate({ ...params, client_id: clientId }),
    deleteReport: deleteReportMutation.mutate,
    isGenerating: generateReportMutation.isPending,
    isDeleting: deleteReportMutation.isPending
  };
}

export function useWorkingPapers(clientId: string, year?: number) {
  const queryClient = useQueryClient();

  const {
    data: workingPapers,
    isLoading: papersLoading
  } = useQuery({
    queryKey: ['workingPapers', clientId, year],
    queryFn: async () => {
      let query = supabase
        .from('audit_working_papers')
        .select('*')
        .eq('client_id', clientId)
        .order('paper_reference', { ascending: true });

      if (year) {
        query = query.eq('period_year', year);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!clientId
  });

  const createPaperMutation = useMutation({
    mutationFn: async (paperData: WorkingPaperFormData) => {
      const { data, error } = await supabase
        .from('audit_working_papers')
        .insert({
          ...paperData,
          client_id: clientId,
          prepared_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workingPapers', clientId] });
    }
  });

  const updatePaperMutation = useMutation({
    mutationFn: async ({ id, ...paperData }: WorkingPaperFormData & { id: string }) => {
      const { data, error } = await supabase
        .from('audit_working_papers')
        .update(paperData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workingPapers', clientId] });
    }
  });

  const deletePaperMutation = useMutation({
    mutationFn: async (paperId: string) => {
      const { error } = await supabase
        .from('audit_working_papers')
        .delete()
        .eq('id', paperId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workingPapers', clientId] });
    }
  });

  return {
    workingPapers,
    papersLoading,
    createPaper: createPaperMutation.mutate,
    updatePaper: updatePaperMutation.mutate,
    deletePaper: deletePaperMutation.mutate,
    isCreating: createPaperMutation.isPending,
    isUpdating: updatePaperMutation.isPending,
    isDeleting: deletePaperMutation.isPending
  };
}

export function useDocumentationChecklists(clientId: string, year?: number) {
  const queryClient = useQueryClient();

  const {
    data: checklists,
    isLoading: checklistsLoading
  } = useQuery({
    queryKey: ['documentationChecklists', clientId, year],
    queryFn: async () => {
      let query = supabase
        .from('documentation_checklists')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (year) {
        query = query.eq('audit_year', year);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!clientId
  });

  const createChecklistMutation = useMutation({
    mutationFn: async (checklistData: ChecklistFormData) => {
      const { data, error } = await supabase
        .from('documentation_checklists')
        .insert({
          ...checklistData,
          client_id: clientId,
          total_items: checklistData.checklist_data.length,
          completed_items: checklistData.checklist_data.filter(item => item.completed).length,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentationChecklists', clientId] });
    }
  });

  const updateChecklistMutation = useMutation({
    mutationFn: async ({ id, ...checklistData }: ChecklistFormData & { id: string }) => {
      const { data, error } = await supabase
        .from('documentation_checklists')
        .update({
          ...checklistData,
          total_items: checklistData.checklist_data.length,
          completed_items: checklistData.checklist_data.filter(item => item.completed).length
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Update completion status
      await supabase.rpc('update_checklist_completion', { p_checklist_id: id });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentationChecklists', clientId] });
    }
  });

  const deleteChecklistMutation = useMutation({
    mutationFn: async (checklistId: string) => {
      const { error } = await supabase
        .from('documentation_checklists')
        .delete()
        .eq('id', checklistId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentationChecklists', clientId] });
    }
  });

  return {
    checklists,
    checklistsLoading,
    createChecklist: createChecklistMutation.mutate,
    updateChecklist: updateChecklistMutation.mutate,
    deleteChecklist: deleteChecklistMutation.mutate,
    isCreating: createChecklistMutation.isPending,
    isUpdating: updateChecklistMutation.isPending,
    isDeleting: deleteChecklistMutation.isPending
  };
}