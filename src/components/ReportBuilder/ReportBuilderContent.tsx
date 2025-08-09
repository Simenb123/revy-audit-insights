import React, { useState, useEffect } from 'react';
import { useWidgetManager } from '@/contexts/WidgetManagerContext';
import { DashboardCanvas } from './DashboardCanvas';
import { WidgetLibrary } from './WidgetLibrary';
import { StandardReportTemplates } from './StandardReportTemplates';
import { ReportBuilderTabs } from './ReportBuilderTabs';
import { SaveReportDialog } from './SaveReportDialog';
import { LoadReportDialog } from './LoadReportDialog';
import { ClientReportHeader } from './ClientReportHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Save, FolderOpen, Database, LayoutTemplate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useClientReports, type ClientReport } from '@/hooks/useClientReports';
import { useTBVersionOptions } from '@/hooks/useTrialBalanceVersions';
import { ViewModeProvider, useViewMode } from './ViewModeContext';
import { ViewModeToggle } from './ViewModeToggle';
import { FilterProvider } from '@/contexts/FilterContext';
import { toast } from 'sonner';
import { loadReportBuilderSettings, saveReportBuilderSettings } from '@/hooks/useReportBuilderSettings';
interface ReportBuilderContentProps {
  clientId: string;
  hasData: boolean;
  selectedFiscalYear: number;
}

export function ReportBuilderContent({ clientId, hasData, selectedFiscalYear }: ReportBuilderContentProps) {
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  
  const { widgets, layouts, addWidget, removeWidget, updateLayout, clearWidgets, setWidgets, setLayouts, loadFromStorage } = useWidgetManager();
  const { reports, loading, saveReport, deleteReport } = useClientReports(clientId);
  const savedSettings = loadReportBuilderSettings(clientId, selectedFiscalYear);
  // Fetch available trial balance versions
  const { data: versionOptions = [], isLoading: versionsLoading } = useTBVersionOptions(clientId, selectedFiscalYear);
  
  // Set selected version from saved settings if valid, otherwise default to latest
  useEffect(() => {
    if (versionOptions.length === 0 || selectedVersion) return;
    const saved = savedSettings;
    if (saved?.selectedVersion && versionOptions.some(o => o.version === saved.selectedVersion)) {
      setSelectedVersion(saved.selectedVersion);
    } else {
      setSelectedVersion(versionOptions[0].version);
    }
  }, [versionOptions, selectedVersion, savedSettings]);

  // Load any persisted widgets/layouts on mount
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // Persist selected version when it changes
  useEffect(() => {
    if (!selectedVersion) return;
    const prev = loadReportBuilderSettings(clientId, selectedFiscalYear) || {};
    saveReportBuilderSettings(clientId, selectedFiscalYear, { ...prev, selectedVersion });
  }, [clientId, selectedFiscalYear, selectedVersion]);

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

  const handleApplyTemplate = (templateWidgets: any[], templateLayouts: any[]) => {
    clearWidgets();
    setWidgets(templateWidgets);
    setLayouts(templateLayouts);
    toast.success('Rapport mal lastet!');
  };
  function ViewModeSettingsSync(): JSX.Element | null {
    const { isViewMode } = useViewMode();
    useEffect(() => {
      const prev = loadReportBuilderSettings(clientId, selectedFiscalYear) || {};
      saveReportBuilderSettings(clientId, selectedFiscalYear, { ...prev, isViewMode });
    }, [isViewMode]);
    return null;
  }

  return (
    <ViewModeProvider initialIsViewMode={!!savedSettings?.isViewMode}>
      <FilterProvider>
        <div className="space-y-6">
        {/* Client Report Header */}
        <ClientReportHeader 
          clientId={clientId} 
          selectedFiscalYear={selectedFiscalYear} 
        />
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
          <div>
            <h2 className="text-2xl font-bold">Rapportbygger</h2>
            <p className="text-muted-foreground">
              Bygg tilpassede dashboards og rapporter basert på regnskapsdata
            </p>
          </div>
          
          <div className="flex flex-col gap-4">
            {/* Version Selector */}
            {versionOptions.length > 0 && (
              <div className="flex items-center gap-2 min-w-0">
                <Label htmlFor="version-select" className="flex items-center gap-1 text-sm whitespace-nowrap">
                  <Database className="h-4 w-4" />
                  Dataversjon:
                </Label>
                <Select value={selectedVersion} onValueChange={setSelectedVersion}>
                  <SelectTrigger id="version-select" className="w-[200px]">
                    <SelectValue placeholder="Velg versjon" />
                  </SelectTrigger>
                  <SelectContent>
                    {versionOptions.map((option) => (
                      <SelectItem key={option.id} value={option.version}>
                        {option.label}
                        {option.is_locked && (
                          <span className="ml-2 text-xs text-muted-foreground">(Låst)</span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="flex flex-wrap gap-2">
              <ViewModeToggle 
                disabled={!hasData || widgets.length === 0 || !selectedVersion}
              />
              
              <Button
                variant="outline"
                onClick={() => setShowWidgetLibrary(!showWidgetLibrary)}
                className="flex items-center gap-2"
                disabled={!hasData || !selectedVersion}
              >
                <Plus className="h-4 w-4" />
                Legg til widget
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setShowTemplates(true)}
                className="flex items-center gap-2"
                disabled={!hasData || !selectedVersion}
              >
                <LayoutTemplate className="h-4 w-4" />
                Rapport maler
              </Button>
              
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => setShowLoadDialog(true)}
                disabled={!hasData || !selectedVersion}
              >
                <FolderOpen className="h-4 w-4" />
                Last rapport
              </Button>
              
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => setShowSaveDialog(true)}
                disabled={!hasData || widgets.length === 0 || !selectedVersion}
              >
                <Save className="h-4 w-4" />
                Lagre rapport
              </Button>
            </div>
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

        {/* Standard Report Templates */}
        {showTemplates && hasData && (
          <Card>
            <CardHeader>
              <CardTitle>Standard rapport maler</CardTitle>
              <CardDescription>
                Velg en ferdig rapport mal for rask oppstart
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StandardReportTemplates 
                clientId={clientId}
                onApplyTemplate={handleApplyTemplate}
                onClose={() => setShowTemplates(false)}
              />
            </CardContent>
          </Card>
        )}

        {/* Dashboard Canvas */}
        {hasData && selectedVersion && (
          <ReportBuilderTabs 
            clientId={clientId} 
            selectedVersion={selectedVersion}
            selectedFiscalYear={selectedFiscalYear}
            hasData={hasData}
          />
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
      </FilterProvider>
    </ViewModeProvider>
  );
}