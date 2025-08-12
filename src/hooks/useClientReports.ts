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

export interface ClientReportVersion {
  id: string;
  report_id: string;
  version_name: string;
  version_description?: string;
  widgets_config: Widget[];
  layout_config: WidgetLayout[];
  created_by: string;
  created_at: string;
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

interface DatabaseReportVersion {
  id: string;
  report_id: string;
  version_name: string;
  version_description: string | null;
  widgets_config: Json;
  layout_config: Json;
  created_by: string;
  created_at: string;
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

  const transformDatabaseVersion = (dbVersion: DatabaseReportVersion): ClientReportVersion => ({
    ...dbVersion,
    version_description: dbVersion.version_description || undefined,
    widgets_config: (dbVersion.widgets_config as unknown) as Widget[],
    layout_config: (dbVersion.layout_config as unknown) as WidgetLayout[]
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

  const saveVersion = async (
    reportId: string,
    versionName: string,
    widgets: Widget[],
    layouts: WidgetLayout[],
    versionDescription?: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('client_report_versions')
        .insert({
          report_id: reportId,
          version_name: versionName,
          version_description: versionDescription,
          widgets_config: widgets as unknown as Json,
          layout_config: layouts as unknown as Json,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      return transformDatabaseVersion(data as DatabaseReportVersion);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunne ikke lagre versjon');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const listVersions = async (reportId: string) => {
    try {
      const { data, error } = await supabase
        .from('client_report_versions')
        .select('*')
        .eq('report_id', reportId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data as DatabaseReportVersion[] || []).map(transformDatabaseVersion);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunne ikke hente versjoner');
      throw err;
    }
  };

  const restoreVersion = async (versionId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data: versionData, error: versionError } = await supabase
        .from('client_report_versions')
        .select('*')
        .eq('id', versionId)
        .single();

      if (versionError) throw versionError;

      const version = transformDatabaseVersion(versionData as DatabaseReportVersion);

      const { data: reportData, error: updateError } = await supabase
        .from('client_reports')
        .update({
          widgets_config: version.widgets_config as unknown as Json,
          layout_config: version.layout_config as unknown as Json,
          updated_at: new Date().toISOString()
        })
        .eq('id', version.report_id)
        .select()
        .single();

      if (updateError) throw updateError;

      const updatedReport = transformDatabaseReport(reportData as DatabaseReport);
      setReports(prev => prev.map(r => r.id === version.report_id ? updatedReport : r));
      return updatedReport;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunne ikke gjenopprette versjon');
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
    saveVersion,
    listVersions,
    restoreVersion,
    refetch: fetchReports
  };
}