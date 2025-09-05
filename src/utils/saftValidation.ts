import type { SaftResult } from './saftParser';

export interface ValidationIssue {
  level: 'info' | 'warning' | 'error' | 'critical';
  field: string;
  message: string;
  count?: number;
  suggestion?: string;
}

export interface ValidationResults {
  saftVersion: string;
  isValid: boolean;
  totalIssues: number;
  issues: ValidationIssue[];
  summary: {
    accounts: number;
    transactions: number;
    customers: number;
    suppliers: number;
    journals: number;
    analysisTypes: number;
  };
  balanceCheck: {
    isBalanced: boolean;
    difference: number;
  };
}

/**
 * Validates a parsed SAF-T file against SAF-T 1.3 requirements
 */
export function validateSaftData(parsed: SaftResult): ValidationResults {
  const issues: ValidationIssue[] = [];
  const saftVersion = parsed.header?.file_version || 'unknown';

  // Check SAF-T version
  if (!saftVersion.includes('1.3')) {
    issues.push({
      level: 'warning',
      field: 'Header',
      message: `SAF-T versjon er ${saftVersion}. For full SAF-T 1.3 kompatibilitet anbefales versjon 1.3.x`,
      suggestion: 'Kontroller at eksporterende system støtter SAF-T 1.3'
    });
  }

  // Validate Header - required fields
  if (!parsed.header) {
    issues.push({
      level: 'critical',
      field: 'Header',
      message: 'Mangler påkrevd Header-seksjon',
      suggestion: 'SAF-T fil må inneholde Header med metadata'
    });
  } else {
    if (!parsed.header.file_version) {
      issues.push({
        level: 'error',
        field: 'Header.FileVersion',
        message: 'Mangler påkrevd AuditFileVersion',
        suggestion: 'Spesifiser SAF-T versjon i header'
      });
    }
    if (!parsed.header.created) {
      issues.push({
        level: 'error',
        field: 'Header.DateCreated',
        message: 'Mangler påkrevd DateCreated',
        suggestion: 'Spesifiser opprettelsesdato for SAF-T fil'
      });
    }
    if (!parsed.header.start || !parsed.header.end) {
      issues.push({
        level: 'warning',
        field: 'Header.Period',
        message: 'Mangler periode-informasjon (StartDate/EndDate)',
        suggestion: 'Spesifiser tidsperiode for dataene'
      });
    }
  }

  // Validate Company - required fields
  if (!parsed.company) {
    issues.push({
      level: 'critical',
      field: 'Company',
      message: 'Mangler påkrevd Company-informasjon',
      suggestion: 'SAF-T fil må inneholde firmaopplysninger'
    });
  } else {
    if (!parsed.company.company_name) {
      issues.push({
        level: 'error',
        field: 'Company.Name',
        message: 'Mangler påkrevd firmanavn',
        suggestion: 'Spesifiser CompanyName i Company-seksjonen'
      });
    }
    if (!parsed.company.org_number) {
      issues.push({
        level: 'error',
        field: 'Company.TaxRegistrationNumber',
        message: 'Mangler påkrevd organisasjonsnummer',
        suggestion: 'Spesifiser TaxRegistrationNumber i Company-seksjonen'
      });
    }
  }

  // Validate Accounts - SAF-T 1.3 requirements
  if (!parsed.accounts || parsed.accounts.length === 0) {
    issues.push({
      level: 'critical',
      field: 'Accounts',
      message: 'Ingen kontoer funnet i SAF-T fil',
      suggestion: 'SAF-T fil må inneholde kontoplan'
    });
  } else {
    let missingGroupingCategory = 0;
    let missingGroupingCode = 0;
    let missingBalances = 0;

    parsed.accounts.forEach((account, index) => {
      if (!account.account_id) {
        issues.push({
          level: 'error',
          field: `Account[${index}].AccountID`,
          message: 'Konto mangler påkrevd AccountID',
          suggestion: 'Alle kontoer må ha unikt AccountID'
        });
      }
      
      // SAF-T 1.3 required fields
      if (!account.grouping_category) {
        missingGroupingCategory++;
      }
      if (!account.grouping_code) {
        missingGroupingCode++;
      }
      
      // Balance validation
      if (account.opening_debit_balance === undefined && account.opening_credit_balance === undefined && account.opening_balance === undefined) {
        missingBalances++;
      }
    });

    if (missingGroupingCategory > 0) {
      issues.push({
        level: saftVersion.includes('1.3') ? 'error' : 'warning',
        field: 'Account.GroupingCategory',
        message: `${missingGroupingCategory} kontoer mangler GroupingCategory`,
        count: missingGroupingCategory,
        suggestion: 'SAF-T 1.3 krever GroupingCategory for alle kontoer'
      });
    }

    if (missingGroupingCode > 0) {
      issues.push({
        level: saftVersion.includes('1.3') ? 'error' : 'warning',
        field: 'Account.GroupingCode',
        message: `${missingGroupingCode} kontoer mangler GroupingCode`,
        count: missingGroupingCode,
        suggestion: 'SAF-T 1.3 krever GroupingCode for alle kontoer'
      });
    }

    if (missingBalances > 0) {
      issues.push({
        level: 'warning',
        field: 'Account.Balances',
        message: `${missingBalances} kontoer mangler åpningssaldo`,
        count: missingBalances,
        suggestion: 'Spesifiser åpningssaldo for alle kontoer'
      });
    }
  }

  // Validate Transactions
  let balanceSum = 0;
  let transactionsWithoutAccount = 0;
  let transactionsWithoutAmount = 0;
  let vatInfoLines = 0;

  if (parsed.transactions) {
    parsed.transactions.forEach((transaction, index) => {
      if (!transaction.account_id) {
        transactionsWithoutAccount++;
      }
      
      const debit = transaction.debit || 0;
      const credit = transaction.credit || 0;
      
      if (debit === 0 && credit === 0) {
        transactionsWithoutAmount++;
      }
      
      balanceSum += debit - credit;
      
      // Check VAT information source
      if (transaction.vat_info_source === 'line') {
        vatInfoLines++;
      }
      
      if (!transaction.posting_date) {
        issues.push({
          level: 'error',
          field: `Transaction[${index}].PostingDate`,
          message: 'Transaksjon mangler posteringsdato',
          suggestion: 'Alle transaksjoner må ha gyldig posteringsdato'
        });
      }
    });

    if (transactionsWithoutAccount > 0) {
      issues.push({
        level: 'critical',
        field: 'Transaction.AccountID',
        message: `${transactionsWithoutAccount} transaksjoner mangler konto-referanse`,
        count: transactionsWithoutAccount,
        suggestion: 'Alle transaksjoner må være koblet til en konto'
      });
    }

    if (transactionsWithoutAmount > 0) {
      issues.push({
        level: 'error',
        field: 'Transaction.Amount',
        message: `${transactionsWithoutAmount} transaksjoner mangler beløp`,
        count: transactionsWithoutAmount,
        suggestion: 'Alle transaksjoner må ha debet- eller kreditbeløp'
      });
    }
  }

  // Balance check
  const isBalanced = Math.abs(balanceSum) < 0.01;
  if (!isBalanced) {
    issues.push({
      level: 'critical',
      field: 'Balance',
      message: `Hovedbok er ikke i balanse. Differanse: ${balanceSum.toFixed(2)}`,
      suggestion: 'Kontroller at alle bilag balanserer (debet = kredit)'
    });
  }

  // VAT information check
  if (parsed.transactions && vatInfoLines > 0) {
    const vatCoverage = (vatInfoLines / parsed.transactions.length) * 100;
    issues.push({
      level: 'info',
      field: 'VAT.Coverage',
      message: `${vatCoverage.toFixed(1)}% av transaksjonene har detaljert mva-informasjon`,
      suggestion: 'SAF-T 1.3 anbefaler TaxInformation på linjenivå'
    });
  }

  // Check for Analysis data (SAF-T 1.3 feature)
  if (parsed.analysis_types && parsed.analysis_types.length > 0) {
    issues.push({
      level: 'info',
      field: 'Analysis',
      message: `Fant ${parsed.analysis_types.length} analysedimensjoner`,
      suggestion: 'Analysedimensjoner kan brukes for kostnadsbærer/prosjekt-rapportering'
    });
  }

  // Check for extended transaction fields (SAF-T 1.3)
  if (parsed.transactions) {
    const transactionsWithExtendedFields = parsed.transactions.filter(t => 
      t.transaction_date || t.system_entry_date || t.modification_date || t.source_system
    ).length;
    
    if (transactionsWithExtendedFields > 0) {
      const coverage = (transactionsWithExtendedFields / parsed.transactions.length) * 100;
      issues.push({
        level: 'info',
        field: 'TransactionFields',
        message: `${coverage.toFixed(1)}% av transaksjonene har utvidede SAF-T 1.3 felt`,
        suggestion: 'Utvidede felt gir bedre revisjonsspor og datakvalitet'
      });
    }
  }

  // Validate BalanceAccountStructure in customers/suppliers
  if (parsed.customers) {
    const customersWithBalanceStructure = parsed.customers.filter(c => 
      c.opening_debit_balance !== undefined || c.opening_credit_balance !== undefined
    ).length;
    
    if (customersWithBalanceStructure > 0 && customersWithBalanceStructure < parsed.customers.length) {
      issues.push({
        level: 'warning',
        field: 'CustomerBalances',
        message: `${customersWithBalanceStructure}/${parsed.customers.length} kunder har balanseinformasjon`,
        suggestion: 'Inkluder BalanceAccountStructure for alle kunder for bedre SAF-T 1.3 kompatibilitet'
      });
    }
  }

  // Summary
  const summary = {
    accounts: parsed.accounts?.length || 0,
    transactions: parsed.transactions?.length || 0,
    customers: parsed.customers?.length || 0,
    suppliers: parsed.suppliers?.length || 0,
    journals: parsed.journals?.length || 0,
    analysisTypes: parsed.analysis_types?.length || 0
  };

  const criticalIssues = issues.filter(i => i.level === 'critical').length;
  const errorIssues = issues.filter(i => i.level === 'error').length;
  
  return {
    saftVersion,
    isValid: criticalIssues === 0 && errorIssues === 0 && isBalanced,
    totalIssues: issues.length,
    issues,
    summary,
    balanceCheck: {
      isBalanced,
      difference: balanceSum
    }
  };
}

/**
 * Validates SAF-T 1.3 schema compliance
 */
export function validateSaft13Compliance(parsed: SaftResult): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Check for required SAF-T 1.3 elements
  if (parsed.accounts) {
    const accountsWithoutGrouping = parsed.accounts.filter(a => !a.grouping_category || !a.grouping_code);
    if (accountsWithoutGrouping.length > 0) {
      issues.push({
        level: 'error',
        field: 'SAF-T_1.3.Accounts',
        message: `${accountsWithoutGrouping.length} kontoer mangler påkrevde GroupingCategory/GroupingCode felt`,
        count: accountsWithoutGrouping.length,
        suggestion: 'SAF-T 1.3 krever GroupingCategory og GroupingCode for alle kontoer'
      });
    }
  }

  // Check for separate debit/credit balances (SAF-T 1.3 requirement)
  if (parsed.accounts) {
    const accountsWithoutSeparateBalances = parsed.accounts.filter(a => 
      a.opening_debit_balance === undefined || a.opening_credit_balance === undefined ||
      a.closing_debit_balance === undefined || a.closing_credit_balance === undefined
    );
    
    if (accountsWithoutSeparateBalances.length > 0) {
      issues.push({
        level: 'warning',
        field: 'SAF-T_1.3.Balances',
        message: `${accountsWithoutSeparateBalances.length} kontoer mangler separate debet/kredit saldi`,
        count: accountsWithoutSeparateBalances.length,
        suggestion: 'SAF-T 1.3 krever separate OpeningDebitBalance/OpeningCreditBalance osv.'
      });
    }
  }

  // Check for BalanceAccountStructure in customers/suppliers
  if (parsed.customers) {
    const customersWithoutBalanceStructure = parsed.customers.filter(c => 
      c.opening_debit_balance === undefined && c.opening_credit_balance === undefined
    );
    
    if (customersWithoutBalanceStructure.length > 0) {
      issues.push({
        level: 'warning',
        field: 'SAF-T_1.3.CustomerBalances',
        message: `${customersWithoutBalanceStructure.length} kunder mangler BalanceAccountStructure`,
        count: customersWithoutBalanceStructure.length,
        suggestion: 'SAF-T 1.3 krever BalanceAccountStructure for kunde-/leverandørsaldi'
      });
    }
  }

  // Check for StandardTaxCode in tax table
  if (parsed.tax_table) {
    const taxCodesWithoutStandard = parsed.tax_table.filter(t => !t.standard_tax_code);
    if (taxCodesWithoutStandard.length > 0) {
      issues.push({
        level: 'error',
        field: 'SAF-T_1.3.TaxCodes',
        message: `${taxCodesWithoutStandard.length} mva-koder mangler StandardTaxCode`,
        count: taxCodesWithoutStandard.length,
        suggestion: 'SAF-T 1.3 krever StandardTaxCode for alle mva-koder'
      });
    }
  }

  return issues;
}

/**
 * Quick validation check for import feasibility
 */
export function quickValidation(parsed: SaftResult): { canImport: boolean; criticalIssues: string[] } {
  const criticalIssues: string[] = [];

  if (!parsed.header) {
    criticalIssues.push('Mangler Header-seksjon');
  }

  if (!parsed.company) {
    criticalIssues.push('Mangler Company-informasjon');
  }

  if (!parsed.accounts || parsed.accounts.length === 0) {
    criticalIssues.push('Ingen kontoer funnet');
  }

  if (!parsed.transactions || parsed.transactions.length === 0) {
    criticalIssues.push('Ingen transaksjoner funnet');
  }

  // Balance check
  if (parsed.transactions) {
    const balanceSum = parsed.transactions.reduce((sum, t) => sum + (t.debit || 0) - (t.credit || 0), 0);
    if (Math.abs(balanceSum) > 0.01) {
      criticalIssues.push(`Hovedbok ikke i balanse (differanse: ${balanceSum.toFixed(2)})`);
    }
  }

  return {
    canImport: criticalIssues.length === 0,
    criticalIssues
  };
}