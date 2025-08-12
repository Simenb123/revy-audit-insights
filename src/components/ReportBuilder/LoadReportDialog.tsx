import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { FileText, Trash2, Calendar, History } from 'lucide-react';
import type { ClientReport, ClientReportVersion } from '@/hooks/useClientReports';

interface LoadReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reports: ClientReport[];
  onLoadReport: (report: ClientReport) => void;
  onDeleteReport: (reportId: string) => void;
  onListVersions?: (reportId: string) => Promise<ClientReportVersion[]>;
  onRestoreVersion?: (versionId: string) => Promise<ClientReport | null>;
  loading?: boolean;
}

export function LoadReportDialog({
  open,
  onOpenChange,
  reports,
  onLoadReport,
  onDeleteReport,
  onListVersions,
  onRestoreVersion,
  loading
}: LoadReportDialogProps) {
  const handleLoadReport = (report: ClientReport) => {
    onLoadReport(report);
    onOpenChange(false);
  };

  const [openReportId, setOpenReportId] = useState<string | null>(null);
  const [versions, setVersions] = useState<Record<string, ClientReportVersion[]>>({});

  const toggleVersions = async (reportId: string) => {
    if (openReportId === reportId) {
      setOpenReportId(null);
      return;
    }
    setOpenReportId(reportId);
    if (!versions[reportId] && onListVersions) {
      const list = await onListVersions(reportId);
      setVersions(prev => ({ ...prev, [reportId]: list }));
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    if (!onRestoreVersion) return;
    const report = await onRestoreVersion(versionId);
    if (report) {
      onLoadReport(report);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[600px]">
        <DialogHeader>
          <DialogTitle>Last rapport</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 max-h-[400px]">
          {reports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Ingen lagrede rapporter funnet</p>
              <p className="text-sm mt-2">Opprett en rapport og lagre den for å se den her.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <h3 className="font-medium truncate">{report.report_name}</h3>
                    </div>
                    {report.report_description && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {report.report_description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(report.updated_at), 'dd. MMM yyyy, HH:mm', { locale: nb })}
                      </div>
                      <div>
                        {report.widgets_config.length} widget{report.widgets_config.length !== 1 ? 'er' : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLoadReport(report)}
                      disabled={loading}
                    >
                      Last
                    </Button>
                    {onListVersions && onRestoreVersion && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleVersions(report.id)}
                        disabled={loading}
                        className="flex items-center gap-1"
                      >
                        <History className="h-4 w-4" />
                        Versjoner
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteReport(report.id)}
                      disabled={loading}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {openReportId === report.id && (
                  <div className="mt-2 ml-6 space-y-1">
                    {(versions[report.id] || []).length === 0 ? (
                      <p className="text-sm text-muted-foreground">Ingen versjoner</p>
                    ) : (
                      versions[report.id].map(v => (
                        <div key={v.id} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm truncate">{v.version_name}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestoreVersion(v.id)}
                            disabled={loading}
                          >
                            Gjenopprett
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Lukk
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}