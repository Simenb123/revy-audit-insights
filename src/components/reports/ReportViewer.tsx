import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Download, FileText, Calendar } from 'lucide-react';

interface ReportViewerProps {
  report: any;
  onBack: () => void;
}

export function ReportViewer({ report, onBack }: ReportViewerProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nb-NO');
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

  const renderReportContent = (data: any) => {
    if (!data) return <p>Ingen rapportdata tilgjengelig</p>;

    // Handle different report types
    if (data.assets && data.liabilities && data.equity) {
      // Balance sheet
      return (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">EIENDELER</h3>
            <div className="space-y-2">
              {data.assets?.accounts?.map((account: any, index: number) => (
                <div key={index} className="flex justify-between">
                  <span>{account.account_name}</span>
                  <span className="font-mono">{account.amount?.toLocaleString('nb-NO', { style: 'currency', currency: 'NOK' })}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Sum eiendeler</span>
                <span className="font-mono">{data.assets?.total?.toLocaleString('nb-NO', { style: 'currency', currency: 'NOK' })}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">GJELD OG EGENKAPITAL</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Gjeld</h4>
                <div className="space-y-2 ml-4">
                  {data.liabilities?.accounts?.map((account: any, index: number) => (
                    <div key={index} className="flex justify-between">
                      <span>{account.account_name}</span>
                      <span className="font-mono">{account.amount?.toLocaleString('nb-NO', { style: 'currency', currency: 'NOK' })}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-medium">
                    <span>Sum gjeld</span>
                    <span className="font-mono">{data.liabilities?.total?.toLocaleString('nb-NO', { style: 'currency', currency: 'NOK' })}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Egenkapital</h4>
                <div className="space-y-2 ml-4">
                  {data.equity?.accounts?.map((account: any, index: number) => (
                    <div key={index} className="flex justify-between">
                      <span>{account.account_name}</span>
                      <span className="font-mono">{account.amount?.toLocaleString('nb-NO', { style: 'currency', currency: 'NOK' })}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-medium">
                    <span>Sum egenkapital</span>
                    <span className="font-mono">{data.equity?.total?.toLocaleString('nb-NO', { style: 'currency', currency: 'NOK' })}</span>
                  </div>
                </div>
              </div>

              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Sum gjeld og egenkapital</span>
                <span className="font-mono">
                  {((data.liabilities?.total || 0) + (data.equity?.total || 0)).toLocaleString('nb-NO', { style: 'currency', currency: 'NOK' })}
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (data.revenue && data.expenses) {
      // Income statement
      return (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">INNTEKTER</h3>
            <div className="space-y-2">
              {data.revenue?.accounts?.map((account: any, index: number) => (
                <div key={index} className="flex justify-between">
                  <span>{account.account_name}</span>
                  <span className="font-mono">{account.amount?.toLocaleString('nb-NO', { style: 'currency', currency: 'NOK' })}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Sum inntekter</span>
                <span className="font-mono">{data.revenue?.total?.toLocaleString('nb-NO', { style: 'currency', currency: 'NOK' })}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">KOSTNADER</h3>
            <div className="space-y-2">
              {data.expenses?.accounts?.map((account: any, index: number) => (
                <div key={index} className="flex justify-between">
                  <span>{account.account_name}</span>
                  <span className="font-mono">{account.amount?.toLocaleString('nb-NO', { style: 'currency', currency: 'NOK' })}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Sum kostnader</span>
                <span className="font-mono">{data.expenses?.total?.toLocaleString('nb-NO', { style: 'currency', currency: 'NOK' })}</span>
              </div>
            </div>
          </div>

          <Separator />
          <div className="flex justify-between font-semibold text-lg">
            <span>Netto resultat</span>
            <span className={`font-mono ${data.net_income >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.net_income?.toLocaleString('nb-NO', { style: 'currency', currency: 'NOK' })}
            </span>
          </div>
        </div>
      );
    }

    // Generic data display
    return (
      <div className="space-y-4">
        <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tilbake til rapporter
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{report.report_name}</h1>
          <p className="text-muted-foreground">
            Generert {formatDate(report.generation_date)}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge className={getStatusColor(report.report_status)}>
            {getStatusText(report.report_status)}
          </Badge>
          {report.file_path && (
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Last ned
            </Button>
          )}
        </div>
      </div>

      {/* Report Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Template</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{report.report_templates?.name || 'Ukjent'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Periode</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {formatDate(report.report_period_start)} - {formatDate(report.report_period_end)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Format</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm uppercase font-medium">
              {report.export_format || 'PDF'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Content */}
      <Card>
        <CardHeader>
          <CardTitle>Rapportinnhold</CardTitle>
        </CardHeader>
        <CardContent>
          {report.report_status === 'completed' ? (
            renderReportContent(report.report_data)
          ) : report.report_status === 'failed' ? (
            <div className="text-center py-8">
              <div className="text-red-600 mb-2">Rapport generering feilet</div>
              {report.error_message && (
                <div className="text-sm text-muted-foreground">
                  {report.error_message}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-muted-foreground">
                Rapporten genereres fortsatt...
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Section */}
      {report.review_notes && (
        <Card>
          <CardHeader>
            <CardTitle>Gjennomgang</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {report.review_date && (
                <p className="text-sm text-muted-foreground">
                  Gjennomgått: {formatDate(report.review_date)}
                </p>
              )}
              <p className="text-sm">{report.review_notes}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}