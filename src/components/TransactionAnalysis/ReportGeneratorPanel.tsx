import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Download, CheckCircle, AlertTriangle } from 'lucide-react';
import { reportGenerationService, ReportTemplate, ReportData, GeneratedReport } from '@/services/reportGenerationService';
import { exportAnalysisReportToPDF } from '@/utils/reportExport';

interface ReportGeneratorPanelProps {
  reportData: ReportData | null;
  isLoading?: boolean;
}

export function ReportGeneratorPanel({ reportData, isLoading }: ReportGeneratorPanelProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('comprehensive');
  const [generatingReport, setGeneratingReport] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<GeneratedReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const templates = reportGenerationService.getAvailableTemplates();

  const handleGenerateReport = async () => {
    if (!reportData) return;

    setGeneratingReport(true);
    setError(null);

    try {
      const report = await reportGenerationService.generateReport(reportData, selectedTemplate);
      setGeneratedReport(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunne ikke generere rapport');
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleExportPDF = async () => {
    if (!generatedReport) return;

    setExportingPDF(true);
    try {
      const pdfBlob = await reportGenerationService.exportToPDF(generatedReport);
      
      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${generatedReport.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunne ikke eksportere PDF');
    } finally {
      setExportingPDF(false);
    }
  };

  const handleDirectPDFExport = async () => {
    if (!reportData) return;

    setExportingPDF(true);
    try {
      await exportAnalysisReportToPDF({
        reportData,
        analysisType: 'comprehensive',
        dateRange: {
          start: reportData.basicAnalysis?.date_range?.start || 'N/A',
          end: reportData.basicAnalysis?.date_range?.end || 'N/A'
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunne ikke eksportere analyse-PDF');
    } finally {
      setExportingPDF(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Rapportgenerator
          </CardTitle>
          <CardDescription>Venter på analysedata...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!reportData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Rapportgenerator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Ingen analysedata tilgjengelig. Kjør en omfattende analyse først.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'destructive';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'secondary';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Rapportgenerator
        </CardTitle>
        <CardDescription>
          Generer profesjonelle revisjonsrapporter basert på analyseresultatene
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Template Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Velg rapportmal</label>
          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <SelectTrigger>
              <SelectValue placeholder="Velg en rapportmal" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{template.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {template.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Template Preview */}
        {selectedTemplate && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Rapportseksjoner</label>
            <div className="flex flex-wrap gap-2">
              {templates.find(t => t.id === selectedTemplate)?.sections.map((section) => (
                <Badge key={section.id} variant="outline">
                  {section.title}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            onClick={handleGenerateReport} 
            disabled={generatingReport || !reportData}
            className="w-full"
          >
            {generatingReport ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Genererer rapport...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Generer rapport
              </>
            )}
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                eller
              </span>
            </div>
          </div>
          
          <Button 
            onClick={handleDirectPDFExport}
            disabled={exportingPDF || !reportData}
            variant="outline"
            className="w-full"
          >
            {exportingPDF ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Eksporterer...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Eksporter direkte til PDF
              </>
            )}
          </Button>
        </div>

        {/* Generated Report Summary */}
        {generatedReport && (
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium">Rapport generert</span>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-sm mb-2">{generatedReport.title}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Overordnet risiko:</span>
                    <Badge 
                      variant={getRiskLevelColor(generatedReport.summary.overallRisk)}
                      className="ml-2"
                    >
                      {generatedReport.summary.overallRisk.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Kontrolltester:</span>
                    <span className="ml-2 font-medium">
                      {generatedReport.summary.testsPassedPercentage}% bestått
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Kritiske problemer:</span>
                    <span className="ml-2 font-medium">
                      {generatedReport.summary.criticalIssues}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Seksjoner:</span>
                    <span className="ml-2 font-medium">
                      {generatedReport.sections.length}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h5 className="font-medium text-sm mb-2">Viktigste funn</h5>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {generatedReport.summary.keyFindings.slice(0, 3).map((finding, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                      <span>{finding}</span>
                    </li>
                  ))}
                  {generatedReport.summary.keyFindings.length > 3 && (
                    <li className="text-xs">
                      ... og {generatedReport.summary.keyFindings.length - 3} flere funn
                    </li>
                  )}
                </ul>
              </div>

              <div>
                <h5 className="font-medium text-sm mb-2">Anbefalinger</h5>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {generatedReport.recommendations.slice(0, 2).map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                  {generatedReport.recommendations.length > 2 && (
                    <li className="text-xs">
                      ... og {generatedReport.recommendations.length - 2} flere anbefalinger
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* Export Options */}
            <div className="flex gap-2 pt-2">
              <Button 
                onClick={handleExportPDF}
                disabled={exportingPDF}
                variant="outline"
                size="sm"
              >
                {exportingPDF ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Eksporterer...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Last ned PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}