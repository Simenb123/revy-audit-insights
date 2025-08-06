import React, { useState } from 'react';
import { useWidgetManager } from '@/contexts/WidgetManagerContext';
import { DashboardCanvas } from './DashboardCanvas';
import { WidgetLibrary } from './WidgetLibrary';
import { SaveReportDialog } from './SaveReportDialog';
import { LoadReportDialog } from './LoadReportDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Save, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useClientReports, type ClientReport } from '@/hooks/useClientReports';
import { toast } from 'sonner';

interface ReportBuilderContentProps {
  clientId: string;
  hasData: boolean;
  selectedFiscalYear: number;
}

export function ReportBuilderContent({ clientId, hasData, selectedFiscalYear }: ReportBuilderContentProps) {
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  
  const { widgets, layouts, addWidget, removeWidget, updateLayout } = useWidgetManager();
  const { reports, loading, saveReport, deleteReport } = useClientReports(clientId);

  const handleSaveReport = async (reportName: string, description?: string) => {
    try {
      await saveReport(reportName, widgets, layouts, description);
      toast.success('Rapport lagret!');
    } catch (error) {
      toast.error('Kunne ikke lagre rapport');
    }
  };

  const handleLoadReport = (report: ClientReport) => {
    // Clear existing widgets
    widgets.forEach(widget => removeWidget(widget.id));
    
    // Add widgets from report
    report.widgets_config.forEach((widget, index) => {
      const layout = report.layout_config[index];
      if (layout) {
        addWidget(widget, layout);
      }
    });
    
    // Update layouts
    updateLayout(report.layout_config);
    
    toast.success(`Rapport "${report.report_name}" lastet!`);
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      await deleteReport(reportId);
      toast.success('Rapport slettet');
    } catch (error) {
      toast.error('Kunne ikke slette rapport');
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
          <div>
            <h2 className="text-2xl font-bold">Rapportbygger</h2>
            <p className="text-muted-foreground">
              Bygg tilpassede dashboards og rapporter basert på regnskapsdata
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setShowWidgetLibrary(!showWidgetLibrary)}
              className="flex items-center gap-2"
              disabled={!hasData}
            >
              <Plus className="h-4 w-4" />
              Legg til widget
            </Button>
            
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => setShowLoadDialog(true)}
              disabled={!hasData}
            >
              <FolderOpen className="h-4 w-4" />
              Last rapport
            </Button>
            
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => setShowSaveDialog(true)}
              disabled={!hasData || widgets.length === 0}
            >
              <Save className="h-4 w-4" />
              Lagre rapport
            </Button>
          </div>
        </div>

        {/* Data Status */}
        {!hasData && (
          <Card>
            <CardHeader>
              <CardTitle>Ingen regnskapsdata funnet</CardTitle>
              <CardDescription>
                Last opp saldobalanse for regnskapsår {selectedFiscalYear} for å bruke rapportbyggeren
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Widget Library */}
        {showWidgetLibrary && hasData && (
          <Card>
            <CardHeader>
              <CardTitle>Widget bibliotek</CardTitle>
              <CardDescription>
                Velg widgets for å legge til i rapporten
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WidgetLibrary 
                clientId={clientId}
                onClose={() => setShowWidgetLibrary(false)}
              />
            </CardContent>
          </Card>
        )}

        {/* Dashboard Canvas */}
        {hasData && (
          <div className="min-h-[600px]">
            <DashboardCanvas clientId={clientId} />
          </div>
        )}
      </div>

      {/* Dialogs */}
      <SaveReportDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        onSave={handleSaveReport}
        loading={loading}
      />

      <LoadReportDialog
        open={showLoadDialog}
        onOpenChange={setShowLoadDialog}
        reports={reports}
        onLoadReport={handleLoadReport}
        onDeleteReport={handleDeleteReport}
        loading={loading}
      />
    </>
  );
}