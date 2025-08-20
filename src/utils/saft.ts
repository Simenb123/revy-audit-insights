import * as XLSX from 'xlsx';
import { parseSaftFile, SaftResult, SaftAccount, SaftTransaction } from './saftParser';

export { parseSaftFile };
export type { SaftResult, SaftAccount, SaftTransaction };

function sheetToFile(sheet: XLSX.WorkSheet, filename: string): File {
  const csv = XLSX.utils.sheet_to_csv(sheet);
  return new File([csv], filename, { type: 'text/csv' });
}

export function toCsvFiles(data: SaftResult): File[] {
  const files: File[] = [];

  if (data.accounts?.length) {
    const sheet = XLSX.utils.json_to_sheet(data.accounts);
    files.push(sheetToFile(sheet, 'accounts.csv'));
  }

  if (data.journals?.length) {
    const sheet = XLSX.utils.json_to_sheet(data.journals);
    files.push(sheetToFile(sheet, 'journals.csv'));
  }

  if (data.transactions?.length) {
    const sheet = XLSX.utils.json_to_sheet(data.transactions);
    files.push(sheetToFile(sheet, 'transactions.csv'));
  }

  return files;
}

export async function toXlsxBlob(data: SaftResult): Promise<Blob> {
  const wb = XLSX.utils.book_new();

  const headerCols = ['file_version','software','software_ver','created','start','end','default_currency'];
  const headerRows = data.header ? [{
    file_version: data.header.file_version ?? '',
    software: data.header.software ?? '',
    software_ver: data.header.software_ver ?? '',
    created: data.header.created ?? '',
    start: data.header.start ?? '',
    end: data.header.end ?? '',
    default_currency: data.header.default_currency ?? ''
  }] : [];

  const companyCols = ['company_name','org_number','country','city','postal','street','email','telephone','currency_code'];
  const companyRows = data.company ? [{
    company_name: data.company.company_name ?? '',
    org_number: data.company.org_number ?? '',
    country: data.company.country ?? '',
    city: data.company.city ?? '',
    postal: data.company.postal ?? '',
    street: data.company.street ?? '',
    email: data.company.email ?? '',
    telephone: data.company.telephone ?? '',
    currency_code: data.company.currency_code ?? ''
  }] : [];

  const bankCols = ['bank_account_number','iban','bank_account_name','bic','sort_code','currency_code','gl_account_id'];
  const bankRows = (data.bank_accounts || []).map(b => ({
    bank_account_number: b.bank_account_number ?? b.number ?? '',
    iban: b.iban ?? '',
    bank_account_name: b.bank_account_name ?? b.name ?? '',
    bic: b.bic ?? '',
    sort_code: b.sort_code ?? '',
    currency_code: b.currency_code ?? b.currency ?? '',
    gl_account_id: b.gl_account_id ?? ''
  }));

  const accountsCols = ['account_id','description','account_type','opening_debit_balance','opening_credit_balance','closing_debit_balance','closing_credit_balance','opening_balance','closing_balance','opening_balance_netto','closing_balance_netto','vat_code'];
  const accountsRows = (data.accounts || []).map(a => ({
    account_id: a.account_id,
    description: a.description ?? '',
    account_type: a.account_type ?? a.type ?? '',
    opening_debit_balance: a.opening_debit_balance ?? '',
    opening_credit_balance: a.opening_credit_balance ?? '',
    closing_debit_balance: a.closing_debit_balance ?? '',
    closing_credit_balance: a.closing_credit_balance ?? '',
    opening_balance: a.opening_balance ?? '',
    closing_balance: a.closing_balance ?? '',
    opening_balance_netto: a.opening_balance_netto ?? '',
    closing_balance_netto: a.closing_balance_netto ?? '',
    vat_code: a.vat_code ?? ''
  }));

  // Enhanced customer and supplier columns including PaymentTerms
  const customersCols = ['id','name','vat','country','city','postal','street','type','status','balance_account','balance_account_id','opening_debit_balance','opening_credit_balance','closing_debit_balance','closing_credit_balance','opening_balance_netto','closing_balance_netto','payment_terms_days','payment_terms_months'];
  const customersRows = (data.customers || []).map(c => ({
    id: c.id ?? '',
    name: c.name ?? '',
    vat: c.vat ?? '',
    country: c.country ?? '',
    city: c.city ?? '',
    postal: c.postal ?? '',
    street: c.street ?? '',
    type: c.type ?? '',
    status: c.status ?? '',
    balance_account: c.balance_account ?? '',
    balance_account_id: c.balance_account_id ?? '',
    opening_debit_balance: c.opening_debit_balance ?? '',
    opening_credit_balance: c.opening_credit_balance ?? '',
    closing_debit_balance: c.closing_debit_balance ?? '',
    closing_credit_balance: c.closing_credit_balance ?? '',
    opening_balance_netto: c.opening_balance_netto ?? '',
    closing_balance_netto: c.closing_balance_netto ?? '',
    payment_terms_days: c.payment_terms_days ?? '',
    payment_terms_months: c.payment_terms_months ?? ''
  }));

  const suppliersCols = ['id','name','vat','country','city','postal','street','type','status','balance_account','balance_account_id','opening_debit_balance','opening_credit_balance','closing_debit_balance','closing_credit_balance','opening_balance_netto','closing_balance_netto','payment_terms_days','payment_terms_months'];
  const suppliersRows = (data.suppliers || []).map(s => ({
    id: s.id ?? '',
    name: s.name ?? '',
    vat: s.vat ?? '',
    country: s.country ?? '',
    city: s.city ?? '',
    postal: s.postal ?? '',
    street: s.street ?? '',
    type: s.type ?? '',
    status: s.status ?? '',
    balance_account: s.balance_account ?? '',
    balance_account_id: s.balance_account_id ?? '',
    opening_debit_balance: s.opening_debit_balance ?? '',
    opening_credit_balance: s.opening_credit_balance ?? '',
    closing_debit_balance: s.closing_debit_balance ?? '',
    closing_credit_balance: s.closing_credit_balance ?? '',
    opening_balance_netto: s.opening_balance_netto ?? '',
    closing_balance_netto: s.closing_balance_netto ?? '',
    payment_terms_days: s.payment_terms_days ?? '',
    payment_terms_months: s.payment_terms_months ?? ''
  }));

  const taxCols = ['tax_code','description','tax_percentage','standard_tax_code','exemption_reason','declaration_period','valid_from','valid_to','base_rate','country'];
  const taxRows = (data.tax_table || []).map(t => ({
    tax_code: t.tax_code ?? '',
    description: t.description ?? '',
    tax_percentage: t.tax_percentage ?? t.percentage ?? '',
    standard_tax_code: t.standard_tax_code ?? '',
    exemption_reason: t.exemption_reason ?? '',
    declaration_period: t.declaration_period ?? '',
    valid_from: t.valid_from ?? '',
    valid_to: t.valid_to ?? '',
    base_rate: t.base_rate ?? '',
    country: t.country ?? ''
  }));

  const analysisTypeCols = ['analysis_type','analysis_type_description','analysis_id','analysis_id_description','start_date','end_date','status'];
  const analysisTypeRows = (data.analysis_types || []).map(a => ({
    analysis_type: a.analysis_type ?? '',
    analysis_type_description: a.analysis_type_description ?? a.description ?? '',
    analysis_id: a.analysis_id ?? '',
    analysis_id_description: a.analysis_id_description ?? '',
    start_date: a.start_date ?? '',
    end_date: a.end_date ?? '',
    status: a.status ?? ''
  }));

  // Compute period start/end per journal from raw transactions
  const journalDateMap = new Map<string, { start?: string; end?: string }>();
  (data.transactions || []).forEach(t => {
    const jid = String(t.journal_id || '');
    const ds = t.posting_date ? new Date(t.posting_date) : undefined;
    if (!ds || isNaN(ds.getTime())) return;
    const rec = journalDateMap.get(jid) || {};
    const curStart = rec.start ? new Date(rec.start) : undefined;
    const curEnd = rec.end ? new Date(rec.end) : undefined;
    if (!curStart || ds < curStart) rec.start = ds.toISOString().split('T')[0];
    if (!curEnd || ds > curEnd) rec.end = ds.toISOString().split('T')[0];
    journalDateMap.set(jid, rec);
  });

  const journalCols = ['journal_id','description','posting_date','journal_type','batch_id','system_id','period_start','period_end'];
  const journalRows = (data.journals || []).map(j => {
    const dates = journalDateMap.get(String(j.journal_id || '')) || {};
    return {
      journal_id: j.journal_id ?? '',
      description: j.description ?? '',
      posting_date: j.posting_date ?? '',
      journal_type: j.journal_type ?? '',
      batch_id: j.batch_id ?? '',
      system_id: j.system_id ?? '',
      period_start: dates.start ?? '',
      period_end: dates.end ?? ''
    };
  });

  const trxCols = [
    'journal_id','record_id','voucher_no','transaction_id','posting_date','transaction_date','system_entry_date','system_entry_time',
    'account_id','description','customer_id','supplier_id','document_no','reference_no','value_date','due_date','cid','cross_reference',
    'currency','amount_currency','exchange_rate','debit','credit',
    'voucher_type','voucher_description','source_id',
    'vat_code','vat_rate','vat_base','vat_debit','vat_credit','amount'
  ];
  const trxRows = (data.transactions || []).map(t => {
    const debitRaw = t.debit;
    const creditRaw = t.credit;
    const vatDebitRaw = t.vat_debit;
    const vatCreditRaw = t.vat_credit;

    const debit = debitRaw !== undefined ? Math.abs(debitRaw) : undefined;
    const credit = creditRaw !== undefined ? -Math.abs(creditRaw) : undefined;
    const vat_debit = vatDebitRaw !== undefined ? Math.abs(vatDebitRaw) : undefined;
    const vat_credit = vatCreditRaw !== undefined ? -Math.abs(vatCreditRaw) : undefined;

    const amountSigned = (debit ?? 0) + (credit ?? 0);
    const amount = (debit !== undefined || credit !== undefined) ? amountSigned : undefined;

    return {
      journal_id: t.journal_id ?? '',
      record_id: t.record_id ?? '',
      voucher_no: t.voucher_no ?? '',
      transaction_id: t.transaction_id ?? '',
      posting_date: t.posting_date ?? '',
      transaction_date: t.transaction_date ?? '',
      system_entry_date: t.system_entry_date ?? '',
      system_entry_time: t.system_entry_time ?? '',
      account_id: t.account_id ?? '',
      description: t.description ?? '',
      customer_id: t.customer_id ?? '',
      supplier_id: t.supplier_id ?? '',
      document_no: t.document_no ?? '',
      reference_no: t.reference_no ?? '',
      value_date: t.value_date ?? '',
      due_date: t.due_date ?? '',
      cid: t.cid ?? '',
      cross_reference: t.cross_reference ?? '',
      currency: t.currency ?? '',
      amount_currency: t.amount_currency,
      exchange_rate: t.exchange_rate,
      debit,
      credit,
      voucher_type: t.voucher_type ?? '',
      voucher_description: t.voucher_description ?? '',
      source_id: t.source_id ?? '',
      vat_code: t.vat_code ?? '',
      vat_rate: t.vat_rate ?? '',
      vat_base: t.vat_base,
      vat_debit,
      vat_credit,
      amount
    };
  });

  const analysisLineCols = ['journal_id','record_id','analysis_type','analysis_id','debit_amt','credit_amt'];
  const analysisLineRows = (data.analysis_lines || []).map(a => ({
    journal_id: a.journal_id ?? '',
    record_id: a.record_id ?? '',
    analysis_type: a.analysis_type ?? '',
    analysis_id: a.analysis_id ?? '',
    debit_amt: a.debit_amt ?? '',
    credit_amt: a.credit_amt ?? ''
  }));

  // AR/AP filtered transactions with enhanced data
  const arTrxRows = trxRows
    .filter(r => String(r.customer_id || '').trim() !== '')
    .map(r => {
      const customer = (data.customers || []).find(c => c.id === r.customer_id);
      return {
        ...r,
        party_id: r.customer_id,
        party_name: customer?.name || '',
        party_type: 'customer'
      };
    });

  const apTrxRows = trxRows
    .filter(r => String(r.supplier_id || '').trim() !== '')
    .map(r => {
      const supplier = (data.suppliers || []).find(s => s.id === r.supplier_id);
      return {
        ...r,
        party_id: r.supplier_id,
        party_name: supplier?.name || '',
        party_type: 'supplier'
      };
    });

  // Calculate aging buckets with PaymentTerms fallback
  const calculateDueDate = (transaction: any): string | undefined => {
    // If due_date exists in transaction, use it
    if (transaction.due_date && String(transaction.due_date).trim() !== '') {
      return transaction.due_date;
    }

    // Fallback to PaymentTerms calculation
    const valueDate = transaction.value_date;
    if (!valueDate || String(valueDate).trim() === '') {
      return undefined;
    }

    // Find customer or supplier payment terms
    let paymentTermsDays: number | undefined;
    let paymentTermsMonths: number | undefined;

    if (transaction.customer_id) {
      const customer = (data.customers || []).find(c => c.id === transaction.customer_id);
      paymentTermsDays = customer?.payment_terms_days;
      paymentTermsMonths = customer?.payment_terms_months;
    } else if (transaction.supplier_id) {
      const supplier = (data.suppliers || []).find(s => s.id === transaction.supplier_id);
      paymentTermsDays = supplier?.payment_terms_days;
      paymentTermsMonths = supplier?.payment_terms_months;
    }

    if (paymentTermsDays === undefined && paymentTermsMonths === undefined) {
      return undefined;
    }

    try {
      const baseDate = new Date(valueDate);
      if (paymentTermsMonths !== undefined && paymentTermsMonths > 0) {
        baseDate.setMonth(baseDate.getMonth() + paymentTermsMonths);
      }
      if (paymentTermsDays !== undefined && paymentTermsDays > 0) {
        baseDate.setDate(baseDate.getDate() + paymentTermsDays);
      }
      return baseDate.toISOString().split('T')[0]; // Return YYYY-MM-DD format
    } catch (e) {
      return undefined;
    }
  };

  const calculateAgingBuckets = (transactions: any[], currentDate = new Date()) => {
    const buckets = {
      'current': { amount: 0, count: 0 },
      '1-30_days': { amount: 0, count: 0 },
      '31-60_days': { amount: 0, count: 0 },
      '61-90_days': { amount: 0, count: 0 },
      '90+_days': { amount: 0, count: 0 },
      'no_due_date': { amount: 0, count: 0 },
      'calculated_from_payment_terms': { amount: 0, count: 0 }
    };

    transactions.forEach(t => {
      const amount = Number(t.amount) || 0;
      const originalDueDate = t.due_date && String(t.due_date).trim() !== '' ? t.due_date : undefined;
      const calculatedDueDate = calculateDueDate(t);
      const dueDate = calculatedDueDate;
      
      if (!dueDate) {
        buckets.no_due_date.amount += amount;
        buckets.no_due_date.count += 1;
        return;
      }

      // Track if due date was calculated from payment terms
      if (!originalDueDate && calculatedDueDate) {
        buckets.calculated_from_payment_terms.amount += amount;
        buckets.calculated_from_payment_terms.count += 1;
      }

      try {
        const dueDateObj = new Date(dueDate);
        const diffTime = currentDate.getTime() - dueDateObj.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 0) {
          buckets.current.amount += amount;
          buckets.current.count += 1;
        } else if (diffDays <= 30) {
          buckets['1-30_days'].amount += amount;
          buckets['1-30_days'].count += 1;
        } else if (diffDays <= 60) {
          buckets['31-60_days'].amount += amount;
          buckets['31-60_days'].count += 1;
        } else if (diffDays <= 90) {
          buckets['61-90_days'].amount += amount;
          buckets['61-90_days'].count += 1;
        } else {
          buckets['90+_days'].amount += amount;
          buckets['90+_days'].count += 1;
        }
      } catch (e) {
        buckets.no_due_date.amount += amount;
        buckets.no_due_date.count += 1;
      }
    });

    return buckets;
  };

  const arAgingBuckets = calculateAgingBuckets(arTrxRows);
  const apAgingBuckets = calculateAgingBuckets(apTrxRows);

  const sum = (ns: number[]) => ns.reduce((acc, v) => acc + (v ?? 0), 0);
  const round2 = (n: number) => Math.round(n * 100) / 100;
  const totalSigned = round2(sum(trxRows.map(r => (Number(r.debit) || 0) + (Number(r.credit) || 0))));
  const byJournal = new Map<string, number>();
  trxRows.forEach(r => {
    const key = String(r.journal_id || '');
    const current = byJournal.get(key) || 0;
    byJournal.set(key, current + (Number(r.debit) || 0) + (Number(r.credit) || 0));
  });
  const journalsOk = Array.from(byJournal.values()).every(v => Math.abs(round2(v)) <= 0.01);
  const byVat = new Map<string, number>();
  trxRows.forEach(r => {
    const key = String(r.vat_code || '');
    const current = byVat.get(key) || 0;
    // Fix: Use Math.abs for both vat_debit and vat_credit to handle negative values properly
    byVat.set(key, current + Math.abs(Number(r.vat_debit) || 0) - Math.abs(Number(r.vat_credit) || 0));
  });
  const mvaOk = Array.from(byVat.values()).every(v => Math.abs(round2(v)) <= 0.01);
  const qualityCols = ['metric','value'];
  const qualityRows = [
    { metric: 'lines_total', value: trxRows.length },
    { metric: 'lines_with_customer_id_pct', value: trxRows.length > 0 ? Math.round((arTrxRows.length / trxRows.length) * 100) : 0 },
    { metric: 'lines_with_supplier_id_pct', value: trxRows.length > 0 ? Math.round((apTrxRows.length / trxRows.length) * 100) : 0 },
    { metric: 'lines_with_document_fields_pct', value: trxRows.length > 0 ? Math.round((trxRows.filter(r => String(r.document_no || r.reference_no || '').trim() !== '').length / trxRows.length) * 100) : 0 },
    { metric: 'lines_with_due_date_pct', value: trxRows.length > 0 ? Math.round((trxRows.filter(r => String(r.due_date || '').trim() !== '').length / trxRows.length) * 100) : 0 },
    { metric: 'lines_with_vat_info_pct', value: trxRows.length > 0 ? Math.round(((data.transactions || []).filter(t => t.vat_info_source === 'line').length / trxRows.length) * 100) : 0 },
    { metric: 'lines_with_currency_pct', value: trxRows.length > 0 ? Math.round((trxRows.filter(r => String(r.currency || '').trim() !== '').length / trxRows.length) * 100) : 0 },
    { metric: 'analysis_with_debit_amt_pct', value: (data.analysis_lines || []).length > 0 ? Math.round(((data.analysis_lines || []).filter(a => (a.debit_amt ?? 0) !== 0).length / (data.analysis_lines || []).length) * 100) : 0 },
    { metric: 'analysis_with_credit_amt_pct', value: (data.analysis_lines || []).length > 0 ? Math.round(((data.analysis_lines || []).filter(a => (a.credit_amt ?? 0) !== 0).length / (data.analysis_lines || []).length) * 100) : 0 },
    { metric: 'ar_lines_total', value: arTrxRows.length },
    { metric: 'ap_lines_total', value: apTrxRows.length },
    { metric: 'unique_customers_in_ar', value: new Set(arTrxRows.map(t => String(t.customer_id || ''))).size },
    { metric: 'unique_suppliers_in_ap', value: new Set(apTrxRows.map(t => String(t.supplier_id || ''))).size },
    { metric: 'unique_voucher_no', value: new Set(trxRows.map(t => String(t.voucher_no || ''))).size },
    { metric: 'lines_with_document_fields', value: trxRows.filter(r => String(r.document_no || r.reference_no || '').trim() !== '' ).length },
    { metric: 'lines_with_tax_information', value: (data.transactions || []).filter(t => t.vat_info_source === 'line').length },
    { metric: 'debit_rows_nonzero', value: trxRows.filter(r => (Number(r.debit) || 0) !== 0).length },
    { metric: 'credit_rows_nonzero', value: trxRows.filter(r => (Number(r.credit) || 0) !== 0).length },
    { metric: 'sum_signed_total', value: totalSigned },
    { metric: 'balance_ok', value: Math.abs(totalSigned) <= 0.01 && journalsOk ? 'true' : 'false' },
    { metric: 'balance_diff_total', value: totalSigned },
    { metric: 'mva_ok', value: mvaOk ? 'true' : 'false' },
    // AR Aging metrics
    { metric: 'ar_current_amount', value: Math.round(arAgingBuckets.current.amount * 100) / 100 },
    { metric: 'ar_1_30_days_amount', value: Math.round(arAgingBuckets['1-30_days'].amount * 100) / 100 },
    { metric: 'ar_31_60_days_amount', value: Math.round(arAgingBuckets['31-60_days'].amount * 100) / 100 },
    { metric: 'ar_61_90_days_amount', value: Math.round(arAgingBuckets['61-90_days'].amount * 100) / 100 },
    { metric: 'ar_90_plus_days_amount', value: Math.round(arAgingBuckets['90+_days'].amount * 100) / 100 },
    { metric: 'ar_no_due_date_amount', value: Math.round(arAgingBuckets.no_due_date.amount * 100) / 100 },
    // AP Aging metrics
    { metric: 'ap_current_amount', value: Math.round(apAgingBuckets.current.amount * 100) / 100 },
    { metric: 'ap_1_30_days_amount', value: Math.round(apAgingBuckets['1-30_days'].amount * 100) / 100 },
    { metric: 'ap_31_60_days_amount', value: Math.round(apAgingBuckets['31-60_days'].amount * 100) / 100 },
    { metric: 'ap_61_90_days_amount', value: Math.round(apAgingBuckets['61-90_days'].amount * 100) / 100 },
    { metric: 'ap_90_plus_days_amount', value: Math.round(apAgingBuckets['90+_days'].amount * 100) / 100 },
    { metric: 'ap_no_due_date_amount', value: Math.round(apAgingBuckets.no_due_date.amount * 100) / 100 },
    // PaymentTerms calculation metrics
    { metric: 'ar_calculated_from_payment_terms_count', value: arAgingBuckets.calculated_from_payment_terms.count },
    { metric: 'ap_calculated_from_payment_terms_count', value: apAgingBuckets.calculated_from_payment_terms.count },
    { metric: 'customers_with_payment_terms', value: (data.customers || []).filter(c => c.payment_terms_days !== undefined || c.payment_terms_months !== undefined).length },
    { metric: 'suppliers_with_payment_terms', value: (data.suppliers || []).filter(s => s.payment_terms_days !== undefined || s.payment_terms_months !== undefined).length },
  ];

  // Create aging summary sheets
  const arAgingCols = ['aging_bucket', 'amount', 'count', 'percentage'];
  const totalArAmount = Object.values(arAgingBuckets).reduce((sum, bucket) => sum + bucket.amount, 0);
  const arAgingRows = Object.entries(arAgingBuckets).map(([bucket, data]) => ({
    aging_bucket: bucket,
    amount: Math.round(data.amount * 100) / 100,
    count: data.count,
    percentage: totalArAmount > 0 ? Math.round((data.amount / totalArAmount) * 100 * 100) / 100 : 0
  }));

  const apAgingCols = ['aging_bucket', 'amount', 'count', 'percentage'];
  const totalApAmount = Object.values(apAgingBuckets).reduce((sum, bucket) => sum + bucket.amount, 0);
  const apAgingRows = Object.entries(apAgingBuckets).map(([bucket, data]) => ({
    aging_bucket: bucket,
    amount: Math.round(data.amount * 100) / 100,
    count: data.count,
    percentage: totalApAmount > 0 ? Math.round((data.amount / totalApAmount) * 100 * 100) / 100 : 0
  }));

  if (headerRows.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(headerRows, { header: headerCols }), 'Header');
  if (companyRows.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(companyRows, { header: companyCols }), 'Company');
  if (bankRows.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(bankRows, { header: bankCols }), 'BankAccounts');
  if (accountsRows.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(accountsRows, { header: accountsCols }), 'Accounts');
  if (customersRows.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(customersRows, { header: customersCols }), 'Customers');
  if (suppliersRows.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(suppliersRows, { header: suppliersCols }), 'Suppliers');
  if (taxRows.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(taxRows, { header: taxCols }), 'TaxTable');
  if (analysisTypeRows.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(analysisTypeRows, { header: analysisTypeCols }), 'AnalysisTypeTable');
  if (journalRows.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(journalRows, { header: journalCols }), 'Journals');
  if (trxRows.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(trxRows, { header: trxCols }), 'Transactions');
  if (analysisLineRows.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(analysisLineRows, { header: analysisLineCols }), 'TransactionLines');
  // Enhanced AR/AP columns including party info
  const arApCols = [...trxCols, 'party_id', 'party_name', 'party_type'];
  
  if (arTrxRows.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(arTrxRows, { header: arApCols }), 'AR_Transactions');
  if (apTrxRows.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(apTrxRows, { header: arApCols }), 'AP_Transactions');
  
  // Add aging summary sheets
  if (arTrxRows.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(arAgingRows, { header: arAgingCols }), 'AR_Aging_Summary');
  if (apTrxRows.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(apAgingRows, { header: apAgingCols }), 'AP_Aging_Summary');
  if (analysisLineRows.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(analysisLineRows, { header: analysisLineCols }), 'LineAnalysis');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(qualityRows, { header: qualityCols }), 'Quality');

  const arrayBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([arrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
}
