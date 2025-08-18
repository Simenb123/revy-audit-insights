import { supabase } from '@/integrations/supabase/client';

export interface ControlTestResult {
  testName: string;
  passed: boolean;
  errorCount: number;
  details: any[];
  description: string;
  severity: 'info' | 'warning' | 'error';
}

export interface VoucherValidation {
  voucherNumber: string;
  isBalanced: boolean;
  difference: number;
  transactionCount: number;
  accounts: string[];
}

export interface AccountFlowValidation {
  transactionId: string;
  voucherNumber: string;
  accountNumber: string;
  auditArea: string;
  hasValidCounterAccount: boolean;
  invalidFlowReason?: string;
}

export interface DuplicateTransactionValidation {
  duplicateGroup: {
    amount: number;
    date: string;
    description: string;
    accountNumber: string;
    transactions: Array<{
      id: string;
      voucherNumber: string;
    }>;
  };
}

export interface TimeLogicValidation {
  transactionId: string;
  voucherNumber: string;
  transactionDate: string;
  issue: 'future_date' | 'weekend_posting' | 'holiday_posting' | 'very_old_date';
  description: string;
}

export class ControlTestSuite {
  
  /**
   * Utfører komplett kontrolltestsuite på transaksjoner
   */
  async runCompleteControlTests(clientId: string, versionId?: string): Promise<ControlTestResult[]> {
    console.log('Starting control tests for:', { clientId, versionId });
    
    const transactions = await this.getTransactionData(clientId, versionId);
    console.log(`Found ${transactions.length} transactions for control testing`);
    
    const auditAreas = await this.getAuditAreaMappings(clientId);
    console.log(`Found ${auditAreas.length} audit area mappings`);
    
    const results: ControlTestResult[] = [];
    
    // 1. Balansekontroll per bilag
    results.push(await this.testVoucherBalance(transactions));
    
    // 2. Forventede motkonti (audit area kontroll)
    results.push(await this.testAccountFlows(transactions, auditAreas));
    
    // 3. Dubletter og sekvens
    results.push(await this.testDuplicates(transactions));
    
    // 4. Tidslogikk kontroller
    results.push(await this.testTimeLogic(transactions));
    
    // 5. Totalbalanse kontroll
    results.push(await this.testOverallBalance(transactions));
    
    // 6. Sekvenskontroll for bilagsnummer
    results.push(await this.testVoucherSequence(transactions));
    
    return results;
  }

  /**
   * Hent transaksjonsdata for testing
   */
  private async getTransactionData(clientId: string, versionId?: string) {
    console.log('Fetching transaction data for control tests:', { clientId, versionId });
    
    let query = supabase
      .from('general_ledger_transactions')
      .select(`
        id,
        transaction_date,
        client_account_id,
        description,
        debit_amount,
        credit_amount,
        balance_amount,
        voucher_number,
        reference_number,
        period_year,
        period_month,
        client_chart_of_accounts!inner(
          account_number,
          account_name,
          account_mappings(
            standard_account_id,
            standard_accounts(
              audit_area:analysis_group
            )
          )
        )
      `)
      .eq('client_id', clientId);

    if (versionId) {
      query = query.eq('version_id', versionId);
    } else {
      // If no version specified, get the active version
      const { data: activeVersion } = await supabase
        .from('accounting_data_versions')
        .select('id')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .single();
      
      if (activeVersion) {
        query = query.eq('version_id', activeVersion.id);
      }
    }

    const { data, error } = await query.order('transaction_date', { ascending: true });
    
    if (error) {
      console.error('Control test data query error:', error);
      throw error;
    }
    
    console.log(`Control tests found ${data?.length || 0} transactions`);
    return data || [];
  }

  /**
   * Hent audit area mappings for kontotyper
   */
  private async getAuditAreaMappings(clientId: string) {
    const { data, error } = await supabase
      .from('client_chart_of_accounts')
      .select(`
        account_number,
        account_mappings(
          standard_accounts(
            analysis_group
          )
        )
      `)
      .eq('client_id', clientId);

    if (error) throw error;
    
    // Create mapping from account number to audit area
    const mapping: Record<string, string> = {};
    data?.forEach(account => {
      const auditArea = account.account_mappings?.[0]?.standard_accounts?.analysis_group || 'other';
      mapping[account.account_number] = auditArea;
    });
    
    return mapping;
  }

  /**
   * Test 1: Balansekontroll per bilag
   */
  private async testVoucherBalance(transactions: any[]): Promise<ControlTestResult> {
    const voucherGroups = new Map<string, any[]>();
    
    // Grupper transaksjoner per bilag
    transactions.forEach(tx => {
      const voucherNum = tx.voucher_number || 'NO_VOUCHER';
      if (!voucherGroups.has(voucherNum)) {
        voucherGroups.set(voucherNum, []);
      }
      voucherGroups.get(voucherNum)!.push(tx);
    });

    const unbalancedVouchers: VoucherValidation[] = [];
    
    voucherGroups.forEach((voucherTxs, voucherNumber) => {
      const totalDebit = voucherTxs.reduce((sum, tx) => sum + (tx.debit_amount || 0), 0);
      const totalCredit = voucherTxs.reduce((sum, tx) => sum + (tx.credit_amount || 0), 0);
      const difference = Math.abs(totalDebit - totalCredit);
      
      if (difference > 0.01) { // Toleranse på 1 øre
        unbalancedVouchers.push({
          voucherNumber,
          isBalanced: false,
          difference,
          transactionCount: voucherTxs.length,
          accounts: [...new Set(voucherTxs.map(tx => tx.client_chart_of_accounts?.account_number))]
        });
      }
    });

    return {
      testName: 'voucher_balance',
      passed: unbalancedVouchers.length === 0,
      errorCount: unbalancedVouchers.length,
      details: unbalancedVouchers,
      description: 'Kontrollerer at alle bilag går i null (debet = kredit)',
      severity: unbalancedVouchers.length > 0 ? 'error' : 'info'
    };
  }

  /**
   * Test 2: Forventede motkonti (audit area kontroll)
   */
  private async testAccountFlows(transactions: any[], auditAreas: Record<string, string>): Promise<ControlTestResult> {
    const invalidFlows: AccountFlowValidation[] = [];
    
    // Definer forventede flyter mellom audit areas
    const expectedFlows: Record<string, string[]> = {
      'sales': ['receivables', 'cash', 'bank'],
      'purchases': ['payables', 'cash', 'bank', 'inventory'],
      'inventory': ['purchases', 'cogs'],
      'payroll': ['cash', 'bank', 'payables'],
      'finance': ['bank', 'receivables', 'payables']
    };

    // Grupper transaksjoner per bilag
    const voucherGroups = new Map<string, any[]>();
    transactions.forEach(tx => {
      const voucherNum = tx.voucher_number || 'NO_VOUCHER';
      if (!voucherGroups.has(voucherNum)) {
        voucherGroups.set(voucherNum, []);
      }
      voucherGroups.get(voucherNum)!.push(tx);
    });

    voucherGroups.forEach((voucherTxs, voucherNumber) => {
      voucherTxs.forEach(tx => {
        const accountNumber = tx.client_chart_of_accounts?.account_number;
        const auditArea = auditAreas[accountNumber] || 'other';
        
        if (expectedFlows[auditArea]) {
          // Sjekk om det finnes gyldige motkonti i samme bilag
          const otherAccountsInVoucher = voucherTxs
            .filter(otherTx => otherTx.id !== tx.id)
            .map(otherTx => auditAreas[otherTx.client_chart_of_accounts?.account_number] || 'other');
          
          const hasValidCounterAccount = expectedFlows[auditArea].some(expectedArea => 
            otherAccountsInVoucher.includes(expectedArea)
          );
          
          if (!hasValidCounterAccount && voucherTxs.length > 1) {
            invalidFlows.push({
              transactionId: tx.id,
              voucherNumber,
              accountNumber,
              auditArea,
              hasValidCounterAccount: false,
              invalidFlowReason: `Forventet motpost i: ${expectedFlows[auditArea].join(', ')}`
            });
          }
        }
      });
    });

    return {
      testName: 'account_flows',
      passed: invalidFlows.length === 0,
      errorCount: invalidFlows.length,
      details: invalidFlows,
      description: 'Kontrollerer at transaksjoner har logiske motkonti innen forventet audit area',
      severity: invalidFlows.length > 5 ? 'error' : 'warning'
    };
  }

  /**
   * Test 3: Dubletter og sekvens
   */
  private async testDuplicates(transactions: any[]): Promise<ControlTestResult> {
    const duplicates: DuplicateTransactionValidation[] = [];
    
    // Grupper transaksjoner etter nøkkelfelter
    const transactionGroups = new Map<string, any[]>();
    
    transactions.forEach(tx => {
      const key = `${tx.transaction_date}_${tx.debit_amount || 0}_${tx.credit_amount || 0}_${tx.description}_${tx.client_chart_of_accounts?.account_number}`;
      
      if (!transactionGroups.has(key)) {
        transactionGroups.set(key, []);
      }
      transactionGroups.get(key)!.push(tx);
    });

    // Finn grupper med mer enn en transaksjon (potensielle dubletter)
    transactionGroups.forEach(group => {
      if (group.length > 1) {
        duplicates.push({
          duplicateGroup: {
            amount: group[0].debit_amount || group[0].credit_amount || 0,
            date: group[0].transaction_date,
            description: group[0].description,
            accountNumber: group[0].client_chart_of_accounts?.account_number,
            transactions: group.map(tx => ({
              id: tx.id,
              voucherNumber: tx.voucher_number
            }))
          }
        });
      }
    });

    return {
      testName: 'duplicates',
      passed: duplicates.length === 0,
      errorCount: duplicates.length,
      details: duplicates,
      description: 'Identifiserer potensielle dupliserte transaksjoner',
      severity: duplicates.length > 10 ? 'error' : 'warning'
    };
  }

  /**
   * Test 4: Tidslogikk kontroller
   */
  private async testTimeLogic(transactions: any[]): Promise<ControlTestResult> {
    const timeIssues: TimeLogicValidation[] = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // Norske helligdager (kan utvides)
    const holidays = [
      '01-01', // Nyttårsdag
      '05-01', // 1. mai
      '05-17', // 17. mai
      '12-25', // Juledag
      '12-26'  // 2. juledag
    ];

    transactions.forEach(tx => {
      const txDate = new Date(tx.transaction_date);
      const dayOfWeek = txDate.getDay(); // 0 = søndag, 6 = lørdag
      const monthDay = `${String(txDate.getMonth() + 1).padStart(2, '0')}-${String(txDate.getDate()).padStart(2, '0')}`;
      
      // Fremtidige datoer
      if (txDate > now) {
        timeIssues.push({
          transactionId: tx.id,
          voucherNumber: tx.voucher_number,
          transactionDate: tx.transaction_date,
          issue: 'future_date',
          description: 'Transaksjon datert i fremtiden'
        });
      }
      
      // Veldig gamle datoer (mer enn 5 år tilbake)
      if (txDate.getFullYear() < currentYear - 5) {
        timeIssues.push({
          transactionId: tx.id,
          voucherNumber: tx.voucher_number,
          transactionDate: tx.transaction_date,
          issue: 'very_old_date',
          description: 'Transaksjon mer enn 5 år gammel'
        });
      }
      
      // Weekend posteringer
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        timeIssues.push({
          transactionId: tx.id,
          voucherNumber: tx.voucher_number,
          transactionDate: tx.transaction_date,
          issue: 'weekend_posting',
          description: 'Transaksjon postert på helg'
        });
      }
      
      // Helligdag posteringer
      if (holidays.includes(monthDay)) {
        timeIssues.push({
          transactionId: tx.id,
          voucherNumber: tx.voucher_number,
          transactionDate: tx.transaction_date,
          issue: 'holiday_posting',
          description: 'Transaksjon postert på helligdag'
        });
      }
    });

    return {
      testName: 'time_logic',
      passed: timeIssues.length === 0,
      errorCount: timeIssues.length,
      details: timeIssues,
      description: 'Kontrollerer transaksjonsdatoer for uvanlige tidspunkt',
      severity: timeIssues.some(issue => issue.issue === 'future_date') ? 'error' : 'warning'
    };
  }

  /**
   * Test 5: Totalbalanse kontroll
   */
  private async testOverallBalance(transactions: any[]): Promise<ControlTestResult> {
    const totalDebit = transactions.reduce((sum, tx) => sum + (tx.debit_amount || 0), 0);
    const totalCredit = transactions.reduce((sum, tx) => sum + (tx.credit_amount || 0), 0);
    const difference = Math.abs(totalDebit - totalCredit);
    
    const isBalanced = difference <= 0.01; // Toleranse på 1 øre
    
    return {
      testName: 'overall_balance',
      passed: isBalanced,
      errorCount: isBalanced ? 0 : 1,
      details: [{
        totalDebit,
        totalCredit,
        difference,
        transactionCount: transactions.length
      }],
      description: 'Kontrollerer at total debet = total kredit for hele datasettet',
      severity: isBalanced ? 'info' : 'error'
    };
  }

  /**
   * Test 6: Sekvenskontroll for bilagsnummer
   */
  private async testVoucherSequence(transactions: any[]): Promise<ControlTestResult> {
    const sequenceIssues: Array<{
      issue: 'missing_voucher' | 'duplicate_voucher' | 'sequence_gap';
      voucherNumber?: string;
      description: string;
      details?: any;
    }> = [];

    // Filtrer ut transaksjoner uten bilagsnummer
    const transactionsWithVouchers = transactions.filter(tx => tx.voucher_number);
    const missingVoucherCount = transactions.length - transactionsWithVouchers.length;
    
    if (missingVoucherCount > 0) {
      sequenceIssues.push({
        issue: 'missing_voucher',
        description: `${missingVoucherCount} transaksjoner mangler bilagsnummer`,
        details: { count: missingVoucherCount }
      });
    }

    // Samle alle bilagsnumre og sjekk for duplikater
    const voucherCounts = new Map<string, number>();
    transactionsWithVouchers.forEach(tx => {
      const voucher = tx.voucher_number;
      voucherCounts.set(voucher, (voucherCounts.get(voucher) || 0) + 1);
    });

    // Finn duplikater (flere bilag med samme nummer)
    const duplicates: string[] = [];
    voucherCounts.forEach((count, voucher) => {
      if (count > 1) {
        duplicates.push(voucher);
      }
    });

    duplicates.forEach(voucher => {
      sequenceIssues.push({
        issue: 'duplicate_voucher',
        voucherNumber: voucher,
        description: `Bilagsnummer ${voucher} brukes ${voucherCounts.get(voucher)} ganger`,
        details: { occurrences: voucherCounts.get(voucher) }
      });
    });

    // Sjekk for sekvensielle hull (kun hvis bilagsnumre er numeriske)
    const numericVouchers = Array.from(voucherCounts.keys())
      .filter(voucher => /^\d+$/.test(voucher))
      .map(voucher => parseInt(voucher))
      .sort((a, b) => a - b);

    if (numericVouchers.length > 1) {
      const gaps: number[] = [];
      for (let i = 1; i < numericVouchers.length; i++) {
        const current = numericVouchers[i];
        const previous = numericVouchers[i - 1];
        const expectedNext = previous + 1;
        
        if (current > expectedNext) {
          for (let missing = expectedNext; missing < current; missing++) {
            gaps.push(missing);
          }
        }
      }

      if (gaps.length > 0 && gaps.length <= 10) { // Rapporter kun hvis ikke for mange hull
        gaps.forEach(missingNumber => {
          sequenceIssues.push({
            issue: 'sequence_gap',
            voucherNumber: missingNumber.toString(),
            description: `Manglende bilagsnummer: ${missingNumber}`,
            details: { missingNumber }
          });
        });
      } else if (gaps.length > 10) {
        sequenceIssues.push({
          issue: 'sequence_gap',
          description: `${gaps.length} manglende bilagsnumre i sekvensen`,
          details: { gapCount: gaps.length, firstGap: gaps[0], lastGap: gaps[gaps.length - 1] }
        });
      }
    }

    const errorCount = sequenceIssues.length;
    const hasSerious = duplicates.length > 0 || missingVoucherCount > transactions.length * 0.1;

    return {
      testName: 'voucher_sequence',
      passed: errorCount === 0,
      errorCount,
      details: sequenceIssues,
      description: 'Kontrollerer sekvens og unike bilagsnumre',
      severity: hasSerious ? 'error' : errorCount > 0 ? 'warning' : 'info'
    };
  }
}

export const controlTestSuite = new ControlTestSuite();