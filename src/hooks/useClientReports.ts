import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Widget, WidgetLayout } from '@/contexts/WidgetManagerContext';
import type { Json } from '@/integrations/supabase/types';

export interface ClientReport {
  id: string;
  client_id: string;
  report_name: string;
  report_description?: string;
  widgets_config: Widget[];
  layout_config: WidgetLayout[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface DatabaseReport {
  id: string;
  client_id: string;
  report_name: string;
  report_description: string | null;
  widgets_config: Json;
  layout_config: Json;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function useClientReports(clientId: string) {
  const [reports, setReports] = useState<ClientReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const transformDatabaseReport = (dbReport: DatabaseReport): ClientReport => ({
    ...dbReport,
    report_description: dbReport.report_description || undefined,
    widgets_config: (dbReport.widgets_config as unknown) as Widget[],
    layout_config: (dbReport.layout_config as unknown) as WidgetLayout[]
  });

  const fetchReports = async () => {
    if (!clientId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('client_reports')
        .select('*')
        .eq('client_id', clientId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      const transformedReports = (data as DatabaseReport[] || []).map(transformDatabaseReport);
      setReports(transformedReports);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunne ikke hente rapporter');
    } finally {
      setLoading(false);
    }
  };

  const saveReport = async (
    reportName: string,
    widgets: Widget[],
    layouts: WidgetLayout[],
    reportDescription?: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('client_reports')
        .insert({
          client_id: clientId,
          report_name: reportName,
          report_description: reportDescription,
          widgets_config: widgets as unknown as Json,
          layout_config: layouts as unknown as Json,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;
      
      const transformedReport = transformDatabaseReport(data as DatabaseReport);
      setReports(prev => [transformedReport, ...prev]);
      return transformedReport;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunne ikke lagre rapport');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateReport = async (
    reportId: string,
    reportName: string,
    widgets: Widget[],
    layouts: WidgetLayout[],
    reportDescription?: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('client_reports')
        .update({
          report_name: reportName,
          report_description: reportDescription,
          widgets_config: widgets as unknown as Json,
          layout_config: layouts as unknown as Json
        })
        .eq('id', reportId)
        .select()
        .single();

      if (error) throw error;
      
      const transformedReport = transformDatabaseReport(data as DatabaseReport);
      setReports(prev => prev.map(r => r.id === reportId ? transformedReport : r));
      return transformedReport;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunne ikke oppdatere rapport');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteReport = async (reportId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('client_reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;
      
      setReports(prev => prev.filter(r => r.id !== reportId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunne ikke slette rapport');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [clientId]);

  return {
    reports,
    loading,
    error,
    saveReport,
    updateReport,
    deleteReport,
    refetch: fetchReports
  };
}