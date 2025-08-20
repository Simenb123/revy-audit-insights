// Export service for audit sampling results

import { SamplingResult, SamplingParams, ExportFormat } from './types';
import { formatCurrency, formatNumber, formatPercentage } from './utils';

/**
 * Export sampling results to CSV format
 */
export function exportToCSV(
  result: SamplingResult,
  params: SamplingParams,
  format: ExportFormat
): string {
  const lines: string[] = [];
  
  // Add header with metadata if requested
  if (format.includeMetadata) {
    lines.push('# Revisjonsutvalg - Eksport');
    lines.push(`# Generert: ${new Date().toLocaleString('nb-NO')}`);
    lines.push(`# Metode: ${result.plan.method}`);
    lines.push(`# Test type: ${result.plan.testType}`);
    lines.push(`# Utvalgsstørrelse: ${result.plan.actualSampleSize}`);
    lines.push(`# Dekning: ${formatPercentage(result.plan.coveragePercentage)}`);
    lines.push('');
  }
  
  // Add parameters if requested
  if (format.includeParameters) {
    lines.push('# PARAMETERE');
    lines.push(`# Regnskapsår,${params.fiscalYear}`);
    lines.push(`# Konfidensgrad,${params.confidenceLevel}%`);
    lines.push(`# Risikonivå,${params.riskLevel}`);
    if (params.materiality) {
      lines.push(`# Vesentlighet,${formatCurrency(params.materiality)}`);
    }
    if (params.performanceMateriality) {
      lines.push(`# Ytelsesvesentlighet,${formatCurrency(params.performanceMateriality)}`);
    }
    if (params.expectedMisstatement) {
      lines.push(`# Forventet feil,${formatCurrency(params.expectedMisstatement)}`);
    }
    lines.push(`# Seed,${params.seed}`);
    lines.push('');
  }
  
  // CSV headers
  const headers = [
    'Transaksjon ID',
    'Dato',
    'Kontonummer',
    'Kontonavn',
    'Beskrivelse',
    'Beløp',
    'Utvalgstype',
    'Metode',
    'Bilagsnummer',
    'Rangering'
  ];
  
  lines.push(headers.join(','));
  
  // Add sample data
  result.samples.total.forEach(sample => {
    const row = [
      `"${sample.id}"`,
      `"${sample.transaction_date}"`,
      `"${sample.account_no}"`,
      `"${sample.account_name}"`,
      `"${sample.description.replace(/"/g, '""')}"`, // Escape quotes
      formatNumber(sample.amount, 2),
      `"${sample.sample_type}"`,
      `"${sample.selection_method || ''}"`,
      `"${sample.voucher_number || ''}"`,
      sample.rank || ''
    ];
    lines.push(row.join(','));
  });
  
  return lines.join('\n');
}

/**
 * Export sampling results to JSON format
 */
export function exportToJSON(
  result: SamplingResult,
  params: SamplingParams,
  format: ExportFormat
): string {
  const exportData: any = {
    exportMetadata: {
      exportedAt: new Date().toISOString(),
      exportedBy: 'Revio Audit Sampling',
      version: '2.0'
    },
    plan: result.plan,
    samples: {
      targeted: result.samples.targeted,
      residual: result.samples.residual,
      total: result.samples.total
    }
  };
  
  if (format.includeParameters) {
    exportData.parameters = params;
  }
  
  if (format.includeMetadata) {
    exportData.metadata = result.metadata;
    if (result.strata) {
      exportData.strata = result.strata;
    }
  }
  
  return JSON.stringify(exportData, null, 2);
}

/**
 * Generate PDF-ready data structure
 * Note: Actual PDF generation would be done with React PDF in the UI
 */
export function preparePDFData(
  result: SamplingResult,
  params: SamplingParams,
  planName: string
): any {
  return {
    title: 'Revisjonsutvalg',
    planName,
    generatedAt: new Date().toLocaleString('nb-NO'),
    
    summary: {
      method: result.plan.method,
      testType: result.plan.testType,
      totalSamples: result.plan.actualSampleSize,
      targeted: result.samples.targeted.length,
      residual: result.samples.residual.length,
      coverage: formatPercentage(result.plan.coveragePercentage),
      seed: result.plan.seed
    },
    
    parameters: {
      fiscalYear: params.fiscalYear,
      confidenceLevel: `${params.confidenceLevel}%`,
      riskLevel: params.riskLevel,
      materiality: params.materiality ? formatCurrency(params.materiality) : null,
      performanceMateriality: params.performanceMateriality ? formatCurrency(params.performanceMateriality) : null,
      expectedMisstatement: params.expectedMisstatement ? formatCurrency(params.expectedMisstatement) : null,
      thresholdMode: params.thresholdMode,
      thresholdAmount: result.metadata.thresholdUsed ? formatCurrency(result.metadata.thresholdUsed) : null
    },
    
    calculations: {
      baseSampleSize: result.metadata.calculations.nBase,
      riskFactor: formatNumber(result.metadata.calculations.riskFactor, 2),
      finalSampleSize: result.metadata.calculations.finalN
    },
    
    samples: result.samples.total.map(sample => ({
      id: sample.id,
      date: sample.transaction_date,
      accountNo: sample.account_no,
      accountName: sample.account_name,
      description: sample.description,
      amount: formatCurrency(sample.amount),
      type: sample.sample_type,
      method: sample.selection_method,
      voucher: sample.voucher_number,
      rank: sample.rank
    })),
    
    strata: result.strata?.map(stratum => ({
      index: stratum.index + 1,
      range: stratum.upperBound 
        ? `${formatCurrency(stratum.lowerBound)} - ${formatCurrency(stratum.upperBound)}`
        : `${formatCurrency(stratum.lowerBound)}+`,
      transactions: stratum.transactions.length,
      allocated: stratum.allocatedSampleSize,
      percentage: stratum.transactions.length > 0 
        ? formatPercentage((stratum.allocatedSampleSize / stratum.transactions.length) * 100)
        : '0%'
    }))
  };
}

/**
 * Create downloadable blob for export
 */
export function createDownloadBlob(content: string, mimeType: string): Blob {
  return new Blob([content], { type: mimeType });
}

/**
 * Trigger download of export file
 */
export function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate filename for export
 */
export function generateExportFilename(
  planName: string,
  exportType: 'CSV' | 'JSON' | 'PDF',
  timestamp?: Date
): string {
  const date = (timestamp || new Date()).toISOString().split('T')[0];
  const sanitizedName = planName.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${sanitizedName}_${date}.${exportType.toLowerCase()}`;
}