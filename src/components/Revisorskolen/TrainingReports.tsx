import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import StandardDataTable, { StandardDataTableColumn } from '@/components/ui/standard-data-table';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';
import { 
  Download,
  FileText,
  Calendar as CalendarIcon,
  Filter,
  Send,
  Eye,
  BarChart3,
  Users,
  Award,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

interface TrainingReport {
  id: string;
  title: string;
  type: 'progress' | 'completion' | 'performance' | 'certification';
  created_at: string;
  created_by: string;
  parameters: any;
  status: 'generating' | 'completed' | 'failed';
  file_path?: string;
}

interface ReportGenerationParams {
  reportType: string;
  dateRange: {
    from: Date;
    to: Date;
  };
  includeUsers: boolean;
  includeScenarios: boolean;
  includeStatistics: boolean;
  format: 'pdf' | 'excel' | 'csv';
}

export const TrainingReports: React.FC = () => {
  const { toast } = useToast();
  const [selectedDates, setSelectedDates] = useState<{from: Date; to: Date}>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date()
  });
  const [reportParams, setReportParams] = useState<ReportGenerationParams>({
    reportType: 'progress',
    dateRange: selectedDates,
    includeUsers: true,
    includeScenarios: true,
    includeStatistics: true,
    format: 'pdf'
  });

  // Gjennbruk av useQuery pattern
  const { data: reports = [], isLoading, refetch } = useQuery({
    queryKey: ['training-reports'],
    queryFn: async () => {
      // Mock data since training_reports table doesn't exist yet
      // In production, this would query the actual table
      const mockReports: TrainingReport[] = [
        {
          id: '1',
          title: 'Månedlig Fremdriftsrapport - Januar 2024',
          type: 'progress',
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          created_by: 'System Administrator',
          parameters: { period: 'january' },
          status: 'completed',
          file_path: '/reports/progress-jan-2024.pdf'
        },
        {
          id: '2',
          title: 'Sertifiseringsrapport Q4 2023',
          type: 'certification',
          created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          created_by: 'HR Manager',
          parameters: { quarter: 'Q4_2023' },
          status: 'completed',
          file_path: '/reports/cert-q4-2023.pdf'
        },
        {
          id: '3',
          title: 'Ytelsesrapport - Pågående',
          type: 'performance',
          created_at: new Date().toISOString(),
          created_by: 'Training Manager',
          parameters: { type: 'detailed' },
          status: 'generating'
        }
      ];

      return mockReports;
    }
  });

  // Gjennbruk av useMutation pattern fra eksisterende komponenter
  const generateReportMutation = useMutation({
    mutationFn: async (params: ReportGenerationParams) => {
      const { data, error } = await supabase.functions.invoke('generate-training-report', {
        body: params
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Rapport genereres",
        description: "Rapporten genereres i bakgrunnen og vil være tilgjengelig snart."
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Feil ved generering",
        description: "Kunne ikke generere rapport. Prøv igjen senere.",
        variant: "destructive"
      });
    }
  });

  const downloadReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const { data, error } = await supabase.functions.invoke('download-training-report', {
        body: { reportId }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, reportId) => {
      // Gjennbruk av download pattern fra eksisterende export services
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `training-report-${reportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Rapport lastet ned",
        description: "Rapporten er lastet ned til din enhet."
      });
    }
  });

  // Gjennbruk av StandardDataTable column pattern
  const reportColumns: StandardDataTableColumn<TrainingReport>[] = [
    {
      key: 'title',
      header: 'Rapporttittel',
      accessor: 'title',
      sortable: true,
      searchable: true
    },
    {
      key: 'type',
      header: 'Type',
      accessor: 'type',
      sortable: true,
      format: (value) => {
        const typeLabels = {
          progress: 'Fremdrift',
          completion: 'Fullføring',
          performance: 'Ytelse',
          certification: 'Sertifisering'
        };
        return (
          <Badge variant="outline">
            {typeLabels[value as keyof typeof typeLabels] || value}
          </Badge>
        );
      }
    },
    {
      key: 'status',
      header: 'Status',
      accessor: 'status',
      sortable: true,
      format: (value) => (
        <Badge 
          variant={value === 'completed' ? 'default' : value === 'failed' ? 'destructive' : 'secondary'}
        >
          {value === 'completed' ? 'Ferdig' : value === 'failed' ? 'Feilet' : 'Genererer'}
        </Badge>
      )
    },
    {
      key: 'created_by',
      header: 'Opprettet av',
      accessor: 'created_by',
      sortable: true,
      searchable: true
    },
    {
      key: 'created_at',
      header: 'Opprettet',
      accessor: 'created_at',
      sortable: true,
      format: (value) => formatDate(value)
    },
    {
      key: 'actions',
      header: 'Handlinger',
      accessor: 'id',
      format: (value, row) => (
        <div className="flex items-center gap-2">
          {row.status === 'completed' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => downloadReportMutation.mutate(value)}
              disabled={downloadReportMutation.isPending}
            >
              <Download className="w-4 h-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm">
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  const handleGenerateReport = () => {
    const params = {
      ...reportParams,
      dateRange: selectedDates
    };
    generateReportMutation.mutate(params);
  };

  const reportTypes = [
    { value: 'progress', label: 'Fremdriftsrapport', icon: BarChart3 },
    { value: 'completion', label: 'Fullføringsrapport', icon: Users },
    { value: 'performance', label: 'Ytelsesrapport', icon: Award },
    { value: 'certification', label: 'Sertifiseringsrapport', icon: FileText }
  ];

  return (
    <div className="space-y-6">
      {/* Report Generation Form - gjennbruk av form patterns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Generer Ny Rapport
          </CardTitle>
          <CardDescription>
            Opprett detaljerte rapporter om treningsaktivitet og fremgang
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reportType">Rapporttype</Label>
              <Select 
                value={reportParams.reportType} 
                onValueChange={(value) => setReportParams(prev => ({ ...prev, reportType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Velg rapporttype" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="w-4 h-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fra dato</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDates.from ? format(selectedDates.from, 'PPP', { locale: nb }) : 'Velg dato'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDates.from}
                    onSelect={(date) => date && setSelectedDates(prev => ({ ...prev, from: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Til dato</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDates.to ? format(selectedDates.to, 'PPP', { locale: nb }) : 'Velg dato'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDates.to}
                    onSelect={(date) => date && setSelectedDates(prev => ({ ...prev, to: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="format">Format</Label>
              <Select 
                value={reportParams.format} 
                onValueChange={(value: 'pdf' | 'excel' | 'csv') => setReportParams(prev => ({ ...prev, format: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={reportParams.includeUsers}
                  onChange={(e) => setReportParams(prev => ({ ...prev, includeUsers: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Inkluder brukerdata</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={reportParams.includeScenarios}
                  onChange={(e) => setReportParams(prev => ({ ...prev, includeScenarios: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Inkluder scenariodata</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={reportParams.includeStatistics}
                  onChange={(e) => setReportParams(prev => ({ ...prev, includeStatistics: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Inkluder statistikk</span>
              </label>
            </div>

            <Button 
              onClick={handleGenerateReport}
              disabled={generateReportMutation.isPending}
              className="flex items-center gap-2"
            >
              {generateReportMutation.isPending ? (
                <Clock className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              Generer Rapport
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing Reports - gjennbruk av StandardDataTable */}
      <Card>
        <CardHeader>
          <CardTitle>Eksisterende Rapporter</CardTitle>
          <CardDescription>
            Oversikt over alle genererte treningsrapporter
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StandardDataTable
            title="Treningsrapporter"
            data={reports}
            columns={reportColumns}
            isLoading={isLoading}
            tableName="training-reports"
            exportFileName="treningsrapporter-oversikt"
          />
        </CardContent>
      </Card>

      {/* Quick Stats - gjennbruk av KPI pattern */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale Rapporter</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.length}</div>
            <p className="text-xs text-muted-foreground">
              {reports.filter(r => r.status === 'completed').length} fullført
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Denne Måneden</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reports.filter(r => new Date(r.created_at).getMonth() === new Date().getMonth()).length}
            </div>
            <p className="text-xs text-muted-foreground">
              +20% fra forrige måned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mest Populære</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Fremdrift</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((reports.filter(r => r.type === 'progress').length / reports.length) * 100)}% av alle rapporter
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TrainingReports;
