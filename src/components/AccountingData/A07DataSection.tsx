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
    
    try {
      // Create multiple sheets for comprehensive export
      const monthlyData = [];
      const paymentData = [];
      const incomeData = [];
      const submissionData = [];
      const allA07Rows = [];
      let validationErrors: string[] = [];
      
      for (const importRecord of payrollImports) {
        // Get raw JSON data for proper A07 parsing
        const { data: rawData } = await supabase
          .from('payroll_raw_data')
          .select('raw_json')
          .eq('payroll_import_id', importRecord.id)
          .single();
        
        // Parse A07 data using new parser
        if (rawData?.raw_json) {
          const { extractEmployeeIncomeRows, validateA07Totals } = await import('@/modules/payroll/lib/a07-parser');
          
          const parseResult = extractEmployeeIncomeRows(rawData.raw_json);
          const validation = validateA07Totals(parseResult.rows, rawData.raw_json);
          
          // Add import ID to each row for tracking
          const rowsWithImport = parseResult.rows.map(row => ({
            'Import ID': importRecord.id,
            'Periode': importRecord.fom_kalendermaaned && importRecord.tom_kalendermaaned 
              ? `${importRecord.fom_kalendermaaned} - ${importRecord.tom_kalendermaaned}`
              : importRecord.period_key,
            'Orgnr': row.orgnr,
            'Ansatt FNR': row.ansattFnr,
            'Navn': row.navn,
            'Beskrivelse': row.beskrivelse,
            'Fordel': row.fordel,
            'Beløp': row.beloep,
            'Antall': row.antall || '',
            'Trekkpliktig': row.trekkpliktig ? 'Ja' : 'Nei',
            'AGA': row.aga ? 'Ja' : 'Nei',
            'Opptj Start': row.opptjStart || '',
            'Opptj Slutt': row.opptjSlutt || ''
          }));
          
          allA07Rows.push(...rowsWithImport);
          
          if (parseResult.errors.length > 0) {
            validationErrors.push(...parseResult.errors.map(err => `${importRecord.id}: ${err}`));
          }
          if (!validation.isValid) {
            validationErrors.push(...validation.discrepancies.map(err => `${importRecord.id}: ${err}`));
          }
        }
        
        // Monthly submissions data
        const { data: monthlySubmissions } = await supabase
          .from('payroll_monthly_submissions')
          .select('*')
          .eq('payroll_import_id', importRecord.id)
          .order('period_year', { ascending: true })
          .order('period_month', { ascending: true });
        
        // Payment information
        const { data: paymentInfo } = await supabase
          .from('payroll_payment_info')
          .select('*')
          .eq('payroll_import_id', importRecord.id)
          .order('calendar_month', { ascending: true });
        
        // Income by type
        const { data: incomeByType } = await supabase
          .from('payroll_income_by_type')
          .select('*')
          .eq('payroll_import_id', importRecord.id)
          .order('calendar_month', { ascending: true });
        
        // Submission details
        const { data: submissionDetails } = await supabase
          .from('payroll_submission_details')
          .select('*')
          .eq('payroll_import_id', importRecord.id)
          .order('calendar_month', { ascending: true });
        
        // Process monthly submissions
        if (monthlySubmissions) {
          for (const submission of monthlySubmissions) {
            const summaryData = (submission.summary_data as any) || {};
            monthlyData.push({
              'Import ID': importRecord.id,
              'Periode': `${submission.period_year}-${String(submission.period_month).padStart(2, '0')}`,
              'År': submission.period_year,
              'Måned': submission.period_month,
              'Antall ansatte': summaryData.count || 0,
              'Arbeidsgiveravgift': summaryData.arbeidsgiveravgift || 0,
              'Forskuddstrekk': summaryData.forskuddstrekk || 0,
              'Finansskatt lønn': summaryData.finansskatt || 0,
              'Opprettet': new Date(submission.created_at).toLocaleString('no-NO')
            });
          }
        }
        
        // Process payment info
        if (paymentInfo) {
          for (const payment of paymentInfo) {
            paymentData.push({
              'Import ID': importRecord.id,
              'Måned': payment.calendar_month,
              'Kontonummer': payment.account_number || '',
              'KID Arbeidsgiveravgift': payment.kid_arbeidsgiveravgift || '',
              'KID Forskuddstrekk': payment.kid_forskuddstrekk || '',
              'KID Finansskatt': payment.kid_finansskatt || '',
              'Forfallsdato': payment.due_date || ''
            });
          }
        }
        
        // Process income by type
        if (incomeByType) {
          for (const income of incomeByType) {
            incomeData.push({
              'Import ID': importRecord.id,
              'Måned': income.calendar_month,
              'Inntektstype': income.income_type,
              'Beskrivelse': income.income_description,
              'Beløp': income.total_amount,
              'Ytelsestype': income.benefit_type,
              'AGA-pliktig': income.triggers_aga ? 'Ja' : 'Nei',
              'Trekkpliktig': income.subject_to_tax_withholding ? 'Ja' : 'Nei'
            });
          }
        }
        
        // Process submission details
        if (submissionDetails) {
          for (const submission of submissionDetails) {
            submissionData.push({
              'Import ID': importRecord.id,
              'Måned': submission.calendar_month,
              'Altinn-referanse': submission.altinn_reference || '',
              'Innsendingsstatus': submission.status || '',
              'Kildesystem': submission.source_system || '',
              'Leveringstidspunkt': submission.delivery_time || '',
              'Meldings-ID': submission.message_id || ''
            });
          }
        }
      }
      
      // Export to multi-sheet Excel with new A07 structure
      await exportEnhancedA07Data(clientName, {
        a07DetailedRows: allA07Rows,
        monthlyData,
        paymentData,
        incomeData,
        submissionData,
        validationErrors
      });
    } catch (error) {
      console.error('A07 export error:', error);
      // Fallback to old export if new parser fails
      await handleLegacyExport();
    }
  };

  const handleLegacyExport = async () => {
    // ... keep existing code as fallback
    const employeeData = [];
    
    for (const importRecord of payrollImports) {
      // Employee data (legacy format)
      const { data: employees } = await supabase
        .from('payroll_employees')
        .select('*')
        .eq('payroll_import_id', importRecord.id);
      
      if (employees) {
        for (const employee of employees) {
          const empData = (employee.employee_data as any) || {};
          employeeData.push({
            'Import ID': importRecord.id,
            'Ansatt-ID': employee.employee_id,
            'Navn': empData.navn || '',
            'Fødselsnummer': empData.norskIdentifikator || '',
            'Data': JSON.stringify(empData)
          });
        }
      }
    }
    
    // Export legacy format
    await exportMultiSheetA07Data(clientName, {
      monthlyData: [],
      paymentData: [],
      incomeData: [],
      submissionData: [],
      employeeData
    });
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

async function exportMultiSheetA07Data(clientName: string, data: any) {
  const { exportMultiSheetA07Data } = await import('@/utils/exportToXlsx');
  exportMultiSheetA07Data(clientName, data);
}

async function exportEnhancedA07Data(clientName: string, data: any) {
  const { exportEnhancedA07Data } = await import('@/utils/exportToXlsx');
  exportEnhancedA07Data(clientName, data);
}