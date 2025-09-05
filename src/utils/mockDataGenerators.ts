// Mock data generators for development and testing

export const generateMockMappings = (reconciliationData: any) => {
  if (!reconciliationData?.items) return [];
  
  return reconciliationData.items.slice(0, 10).map((item: any, index: number) => ({
    sourceAccount: {
      number: item.accounts?.[0]?.number || `${5000 + index}`,
      name: item.accounts?.[0]?.name || item.description,
      amount: item.payrollAmount || 0
    },
    targetAccount: {
      number: `${2940 + index}`,
      name: 'Avsetning feriepenger'
    },
    rule: {
      id: `rule-${index}`,
      source: 'payroll_mapping',
      target: 'gl_account',
      confidence: Math.random() * 0.3 + 0.7, // 70-100%
      type: index < 3 ? 'automatic' : index < 6 ? 'manual' : 'suggested'
    },
    discrepancy: item.discrepancy || 0,
    status: item.status === 'match' ? 'mapped' : 
             item.status === 'major_discrepancy' ? 'conflict' : 'unmapped'
  }));
};

export const generateDataQualityMetrics = (reconciliationData: any) => {
  const totalRecords = reconciliationData?.items?.length || 0;
  const validRecords = Math.floor(totalRecords * 0.92);
  const duplicateRecords = Math.floor(totalRecords * 0.02);
  const missingDataRecords = Math.floor(totalRecords * 0.04);
  const formatErrorRecords = Math.floor(totalRecords * 0.01);
  const businessRuleViolations = Math.floor(totalRecords * 0.01);
  
  const overallScore = validRecords > 0 ? (validRecords / totalRecords) * 100 : 0;

  return {
    totalRecords,
    validRecords,
    duplicateRecords,
    missingDataRecords,
    formatErrorRecords,
    businessRuleViolations,
    overallScore
  };
};

export const generateDataQualityIssues = (reconciliationData: any) => {
  const issues = [];
  const totalRecords = reconciliationData?.items?.length || 0;

  if (totalRecords > 0) {
    // Add some realistic quality issues
    issues.push({
        type: 'warning' as const,
        category: 'data_completeness' as const,
      title: 'Manglende kontonavn',
      description: 'Enkelte kontoer mangler beskrivende navn, kun kontonummer er tilgjengelig.',
      affectedRecords: Math.floor(totalRecords * 0.05),
      recommendation: 'Oppdater kontoplanen med fullstendige kontonavn for bedre sporbarhet.'
    });

    if (totalRecords > 100) {
      issues.push({
        type: 'info' as const,
        category: 'format_validation' as const,
        title: 'Inkonsistent beløpsformatering',
        description: 'Noen beløp bruker forskjellige desimalformater.',
        affectedRecords: Math.floor(totalRecords * 0.02),
        recommendation: 'Standardiser beløpsformat til norsk valutaformat med to desimaler.'
      });
    }

    // Add critical issue if there are major discrepancies
    const majorDiscrepancies = reconciliationData?.items?.filter(
      (item: any) => item.status === 'major_discrepancy'
    )?.length || 0;

    if (majorDiscrepancies > 0) {
      issues.push({
        type: 'critical' as const,
        category: 'business_rules' as const,
        title: 'Store avvik funnet',
        description: 'Det er identifisert betydelige avvik mellom lønnssystem og regnskap som krever oppmerksomhet.',
        affectedRecords: majorDiscrepancies,
        recommendation: 'Gjennomgå og korriger mapping-regler, eller godkjenn avvikene hvis de er forventede.'
      });
    }
  }

  return issues;
};