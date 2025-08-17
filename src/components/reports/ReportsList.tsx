import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, FileText, Edit, Trash2, Download, Eye } from 'lucide-react';
import { useReportManagement } from '@/hooks/useReportManagement';
import { ReportGenerationForm } from './ReportGenerationForm';
import { ReportViewer } from './ReportViewer';
import { formatCurrency } from '@/lib/utils';

interface ReportsListProps {
  clientId: string;
}

export function ReportsList({ clientId }: ReportsListProps) {
  const [showGenerationForm, setShowGenerationForm] = useState(false);
  const [viewingReport, setViewingReport] = useState<any>(null);

  const { 
    generatedReports, 
    reportsLoading, 
    reportSummary,
    deleteReport, 
    isDeleting 
  } = useReportManagement(clientId);

  const handleViewReport = (report: any) => {
    setViewingReport(report);
  };

  const handleCloseViewer = () => {
    setViewingReport(null);
  };

  const handleCloseForm = () => {
    setShowGenerationForm(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'generating': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Fullført';
      case 'generating': return 'Genererer';
      case 'failed': return 'Feilet';
      case 'archived': return 'Arkivert';
      default: return status;
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'financial': return 'Finansiell';
      case 'audit': return 'Revisjon';
      case 'tax': return 'Skatt';
      case 'compliance': return 'Compliance';
      case 'analytical': return 'Analytisk';
      default: return category;
    }
  };

  if (showGenerationForm) {
    return (
      <ReportGenerationForm
        clientId={clientId}
        onCancel={handleCloseForm}
        onSuccess={handleCloseForm}
      />
    );
  }

  if (viewingReport) {
    return (
      <ReportViewer
        report={viewingReport}
        onBack={handleCloseViewer}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {reportSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{reportSummary.total_reports}</div>
              <p className="text-muted-foreground">Totalt rapporter</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{reportSummary.completed_reports}</div>
              <p className="text-muted-foreground">Fullførte rapporter</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{reportSummary.draft_reports}</div>
              <p className="text-muted-foreground">Under generering</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{reportSummary.reports_this_month}</div>
              <p className="text-muted-foreground">Denne måneden</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Genererte rapporter
            </CardTitle>
            <Button onClick={() => setShowGenerationForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Generer rapport
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {reportsLoading ? (
            <div className="text-center py-8">Laster rapporter...</div>
          ) : !generatedReports || generatedReports.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Ingen rapporter funnet</h3>
              <p className="text-muted-foreground mb-4">
                Generer din første rapport for å komme i gang
              </p>
              <Button onClick={() => setShowGenerationForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Generer rapport
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rapportnavn</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Periode</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Generert dato</TableHead>
                  <TableHead>Handlinger</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {generatedReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">
                      {report.report_name}
                      {report.is_final && (
                        <Badge className="ml-2 bg-blue-100 text-blue-800">Final</Badge>
                      )}
                    </TableCell>
                    <TableCell>{report.report_templates?.name || 'Ukjent'}</TableCell>
                    <TableCell>
                      {getCategoryText(report.report_templates?.category || 'custom')}
                    </TableCell>
                    <TableCell>
                      {new Date(report.report_period_start).toLocaleDateString('nb-NO')} - {' '}
                      {new Date(report.report_period_end).toLocaleDateString('nb-NO')}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(report.report_status)}>
                        {getStatusText(report.report_status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(report.generation_date).toLocaleDateString('nb-NO')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewReport(report)}
                          disabled={report.report_status !== 'completed'}
                          title="Vis rapport"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {report.file_path && (
                          <Button
                            variant="outline"
                            size="sm"
                            title="Last ned rapport"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteReport(report.id)}
                          disabled={isDeleting}
                          title="Slett rapport"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}