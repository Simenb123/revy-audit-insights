import React, { useState, useEffect } from 'react';
import { useWidgetManager } from '@/contexts/WidgetManagerContext';
import { DashboardCanvas } from './DashboardCanvas';
import { WidgetLibrary } from './WidgetLibrary';
import { IntroModal } from './IntroModal';
import { StandardReportTemplates } from './StandardReportTemplates';
import { ReportTemplates } from './ReportTemplates';
import { ReportBuilderTabs } from './ReportBuilderTabs';
import { SaveReportDialog } from './SaveReportDialog';
import { LoadReportDialog } from './LoadReportDialog';
import { ClientReportHeader } from './ClientReportHeader';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Save, FolderOpen, Database, LayoutTemplate, FileDown, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useClientReports, type ClientReport, type ClientReportVersion } from '@/hooks/useClientReports';
import { useTBVersionOptions } from '@/hooks/useTrialBalanceVersions';
import { ViewModeProvider, useViewMode } from './ViewModeContext';
import { ViewModeToggle } from './ViewModeToggle';
import { FilterProvider } from '@/contexts/FilterContext';
import { toast } from 'sonner';
import { loadReportBuilderSettings, saveReportBuilderSettings } from '@/hooks/useReportBuilderSettings';
import { exportReportToPDF, exportReportToExcel } from '@/utils/exportReport';
import { ThemeProvider } from '@/contexts/ThemeContext';
import type { ThemeConfig } from '@/styles/theme';
import { ModuleWrapper } from './ModuleWrapper';
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
  const [currentReport, setCurrentReport] = useState<ClientReport | null>(null);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  
  const { widgets, layouts, addWidget, removeWidget, updateLayout, clearWidgets, setWidgets, setLayouts, loadFromStorage } = useWidgetManager();
  const { reports, loading, saveReport, updateReport, deleteReport, saveVersion, listVersions, restoreVersion } = useClientReports(clientId);
  const savedSettings = loadReportBuilderSettings(clientId, selectedFiscalYear);
  const initialTheme = savedSettings?.theme;

  useEffect(() => {
    if (!savedSettings?.introSeen) {
      setShowIntro(true);
    }
  }, [savedSettings]);

  const handleCloseIntro = () => {
    const prev = savedSettings || {};
    saveReportBuilderSettings(clientId, selectedFiscalYear, { ...prev, introSeen: true });
    setShowIntro(false);
  };

  const handleThemeChange = (theme: ThemeConfig) => {
    const prev = loadReportBuilderSettings(clientId, selectedFiscalYear) || {};
    saveReportBuilderSettings(clientId, selectedFiscalYear, { ...prev, theme });
  };
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

  // Track unsaved changes when editing an existing report
  useEffect(() => {
    if (!currentReport) {
      setHasUnsaved(false);
      return;
    }
    const equalWidgets = JSON.stringify(widgets) === JSON.stringify(currentReport.widgets_config);
    const equalLayouts = JSON.stringify(layouts) === JSON.stringify(currentReport.layout_config);
    setHasUnsaved(!(equalWidgets && equalLayouts));
  }, [widgets, layouts, currentReport]);

  const handleSaveReport = async (reportName: string, description?: string) => {
    try {
      const saved = await saveReport(reportName, widgets, layouts, description);
      setCurrentReport(saved);
      setHasUnsaved(false);
      setShowSaveDialog(false);
      toast.success('Rapport lagret!');
    } catch (error) {
      toast.error('Kunne ikke lagre rapport');
    }
  };

  const handleLoadReport = (report: ClientReport) => {
    // Clear current and load from selected report
    clearWidgets();
    setWidgets(report.widgets_config);
    setLayouts(report.layout_config);

    setCurrentReport(report);
    setHasUnsaved(false);
    setShowLoadDialog(false);
    toast.success(`Rapport "${report.report_name}" lastet!`);
  };

  const handleSaveVersion = async (versionName: string, description?: string) => {
    if (!currentReport) return;
    try {
      await saveVersion(currentReport.id, versionName, widgets, layouts, description);
      toast.success('Versjon lagret!');
    } catch (error) {
      toast.error('Kunne ikke lagre versjon');
    }
  };

  const handleListVersions = async (reportId: string): Promise<ClientReportVersion[]> => {
    try {
      return await listVersions(reportId);
    } catch (error) {
      toast.error('Kunne ikke hente versjoner');
      return [];
    }
  };

  const handleRestoreVersion = async (versionId: string): Promise<ClientReport | null> => {
    try {
      const restored = await restoreVersion(versionId);
      if (restored) {
        handleLoadReport(restored);
      }
      return restored;
    } catch (error) {
      toast.error('Kunne ikke gjenopprette versjon');
      return null;
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      await deleteReport(reportId);
      toast.success('Rapport slettet');
    } catch (error) {
      toast.error('Kunne ikke slette rapport');
    }
  };

  const handleSaveChanges = async () => {
    if (!currentReport) return;
    try {
      const updated = await updateReport(
        currentReport.id,
        currentReport.report_name,
        widgets,
        layouts,
        currentReport.report_description
      );
      setCurrentReport(updated);
      setHasUnsaved(false);
      toast.success('Endringer lagret');
    } catch (error) {
      toast.error('Kunne ikke lagre endringer');
    }
  };

  const handleApplyTemplate = (templateWidgets: any[], templateLayouts: any[]) => {
    clearWidgets();
    setWidgets(templateWidgets);
    setLayouts(templateLayouts);
    setCurrentReport(null);
    setHasUnsaved(true);
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
    <ThemeProvider initialTheme={initialTheme} onChange={handleThemeChange}>
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

              {currentReport && hasUnsaved && (
                <Button 
                  variant="default" 
                  className="flex items-center gap-2"
                  onClick={handleSaveChanges}
                  disabled={loading}
                >
                  <Save className="h-4 w-4" />
                  Lagre endringer
                </Button>
              )}

              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => setShowSaveDialog(true)}
                disabled={!hasData || widgets.length === 0 || !selectedVersion}
              >
                <Save className="h-4 w-4" />
                {currentReport ? 'Lagre som ny' : 'Lagre rapport'}
              </Button>

              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => exportReportToPDF(widgets, layouts)}
                disabled={!hasData || widgets.length === 0 || !selectedVersion}
              >
                <FileDown className="h-4 w-4" />
                Eksporter til PDF
              </Button>

              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => exportReportToExcel(widgets, layouts)}
                disabled={!hasData || widgets.length === 0 || !selectedVersion}
              >
                <FileSpreadsheet className="h-4 w-4" />
                Eksporter til Excel
              </Button>

              {currentReport && hasUnsaved && (
                <span className="text-xs text-muted-foreground self-center">Endringer ikke lagret</span>
              )}
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
          <ModuleWrapper id="widget-library" title="Widget bibliotek">
            <p className="text-sm text-muted-foreground mb-2">
              Velg widgets for å legge til i rapporten
            </p>
            <WidgetLibrary
              clientId={clientId}
              onClose={() => setShowWidgetLibrary(false)}
            />
          </ModuleWrapper>
        )}

        {/* Report Templates */}
        {showTemplates && hasData && (
          <ModuleWrapper id="report-templates" title="Rapport maler">
            <ReportTemplates
              clientId={clientId}
              widgets={widgets}
              layouts={layouts}
              onApplyTemplate={handleApplyTemplate}
              onClose={() => setShowTemplates(false)}
            />
          </ModuleWrapper>
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
      <IntroModal open={showIntro} onClose={handleCloseIntro} />

      <SaveReportDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        onSave={handleSaveReport}
        onSaveVersion={currentReport ? handleSaveVersion : undefined}
        loading={loading}
      />

      <LoadReportDialog
        open={showLoadDialog}
        onOpenChange={setShowLoadDialog}
        reports={reports}
        onLoadReport={handleLoadReport}
        onDeleteReport={handleDeleteReport}
        onListVersions={handleListVersions}
        onRestoreVersion={handleRestoreVersion}
        loading={loading}
      />
      </FilterProvider>
      </ViewModeProvider>
    </ThemeProvider>
  );
}