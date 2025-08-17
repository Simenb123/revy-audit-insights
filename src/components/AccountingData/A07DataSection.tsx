import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileDown, Eye, Plus } from 'lucide-react';
import { usePayrollImports } from '@/hooks/usePayrollImports';
import { formatDate } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';
import PayrollImporter from '@/components/PayrollImporter';
import { A07DetailDialog } from './A07DetailDialog';
import { supabase } from '@/integrations/supabase/client';

interface A07DataSectionProps {
  clientId: string;
  clientName: string;
}

export function A07DataSection({ clientId, clientName }: A07DataSectionProps) {
  const { data: payrollImports = [], isLoading } = usePayrollImports(clientId);
  const [showUploader, setShowUploader] = useState(false);
  const [selectedImportId, setSelectedImportId] = useState<string | null>(null);

  const handleExportA07Data = async () => {
    if (payrollImports.length === 0) return;

    // Get detailed monthly data for each import
    const exportData = [];
    
    for (const imp of payrollImports) {
      // Fetch monthly submissions for this import
      const { data: monthlySubmissions } = await supabase
        .from('payroll_monthly_submissions')
        .select('*')
        .eq('payroll_import_id', imp.id)
        .order('period_year', { ascending: true })
        .order('period_month', { ascending: true });

      if (monthlySubmissions?.length) {
        // Add a header row for this import
        exportData.push({
          'Måned': `=== ${imp.period_key} ===`,
          'År': '',
          'Antall ansatte': '',
          'Arbeidsgiveravgift': '',
          'Forskuddstrekk': '',
          'Status': ''
        });

        // Add monthly data
        monthlySubmissions.forEach((submission: any) => {
          const monthName = new Date(submission.period_year, submission.period_month - 1).toLocaleDateString('nb-NO', { year: 'numeric', month: 'long' });
          exportData.push({
            'Måned': monthName,
            'År': submission.period_year,
            'Antall ansatte': submission.summary_data?.count || submission.submission_data?.antallInntektsmottakere || 0,
            'Arbeidsgiveravgift': submission.summary_data?.arbeidsgiveravgift || submission.submission_data?.mottattAvgiftOgTrekkTotalt?.sumArbeidsgiveravgift || 0,
            'Forskuddstrekk': submission.summary_data?.forskuddstrekk || Math.abs(submission.submission_data?.mottattAvgiftOgTrekkTotalt?.sumForskuddstrekk || 0),
            'Status': submission.submission_data?.status || ''
          });
        });

        // Add totals row for this import
        const totalArbeidsgiveravgift = monthlySubmissions.reduce((sum: number, s: any) => sum + (s.summary_data?.arbeidsgiveravgift || s.submission_data?.mottattAvgiftOgTrekkTotalt?.sumArbeidsgiveravgift || 0), 0);
        const totalForskuddstrekk = monthlySubmissions.reduce((sum: number, s: any) => sum + (s.summary_data?.forskuddstrekk || Math.abs(s.submission_data?.mottattAvgiftOgTrekkTotalt?.sumForskuddstrekk || 0)), 0);
        
        exportData.push({
          'Måned': 'TOTALT',
          'År': '',
          'Antall ansatte': monthlySubmissions.reduce((sum: number, s: any) => sum + (s.summary_data?.count || s.submission_data?.antallInntektsmottakere || 0), 0),
          'Arbeidsgiveravgift': totalArbeidsgiveravgift,
          'Forskuddstrekk': totalForskuddstrekk,
          'Status': ''
        });

        // Add spacing
        exportData.push({
          'Måned': '',
          'År': '',
          'Antall ansatte': '',
          'Arbeidsgiveravgift': '',
          'Forskuddstrekk': '',
          'Status': ''
        });
      }
    }

    exportArrayToXlsx(
      `A07_Månedlig_Oversikt_${clientName}_${new Date().toISOString().split('T')[0]}`,
      exportData
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>A07 Lønnsdata</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Laster A07-data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              A07 Lønnsdata
              {payrollImports.length > 0 && (
                <Badge variant="secondary">
                  {payrollImports.length} import{payrollImports.length !== 1 ? 'er' : ''}
                </Badge>
              )}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUploader(!showUploader)}
              >
                <Plus className="w-4 h-4 mr-2" />
                {showUploader ? 'Skjul' : 'Last opp'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportA07Data}
                disabled={payrollImports.length === 0}
              >
                <FileDown className="w-4 h-4 mr-2" />
                Export Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Uploader Section */}
          {showUploader && (
            <div className="border rounded-lg p-4 bg-muted/20">
              <PayrollImporter 
                clientId={clientId}
                clientName={clientName}
              />
            </div>
          )}

          {/* A07 Imports List */}
          {payrollImports.length > 0 ? (
            <div className="space-y-3">
              {payrollImports.map((imp) => (
                <div
                  key={imp.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 cursor-pointer"
                  onClick={() => setSelectedImportId(imp.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">
                          {imp.fom_kalendermaaned && imp.tom_kalendermaaned 
                            ? `${imp.fom_kalendermaaned} - ${imp.tom_kalendermaaned}`
                            : imp.period_key
                          }
                        </h4>
                        {imp.navn && (
                          <Badge variant="outline" className="text-xs">
                            {imp.navn}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {imp.file_name} • Importert {formatDate(imp.created_at)}
                      </div>
                      {imp.antall_personer_innrapportert && (
                        <div className="text-xs text-muted-foreground">
                          {imp.antall_personer_innrapportert} ansatte innrapportert
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={imp.avstemmingstidspunkt ? "default" : "secondary"}>
                      {imp.avstemmingstidspunkt ? "Avstemt" : "Importert"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImportId(imp.id);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>Ingen A07-lønnsdata lastet opp ennå</p>
              <p className="text-sm mt-2">
                Klikk "Last opp" for å importere A07 JSON-filer
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <A07DetailDialog
        importId={selectedImportId}
        open={!!selectedImportId}
        onOpenChange={(open) => !open && setSelectedImportId(null)}
      />
    </>
  );
}

function exportArrayToXlsx(filename: string, data: any[]) {
  // Import the actual function
  import('@/utils/exportToXlsx').then(({ exportArrayToXlsx }) => {
    exportArrayToXlsx(filename, data);
  });
}