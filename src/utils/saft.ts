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

  const customersCols = ['id','name','vat','country','city','postal','street','type','status','balance_account','balance_account_id','opening_debit_balance','opening_credit_balance','closing_debit_balance','closing_credit_balance','opening_balance_netto','closing_balance_netto'];
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
    closing_balance_netto: c.closing_balance_netto ?? ''
  }));

  const suppliersCols = ['id','name','vat','country','city','postal','street','type','status','balance_account','balance_account_id','opening_debit_balance','opening_credit_balance','closing_debit_balance','closing_credit_balance','opening_balance_netto','closing_balance_netto'];
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
    closing_balance_netto: s.closing_balance_netto ?? ''
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

  // AR/AP filtered transactions
  const arTrxRows = trxRows.filter(r => String(r.customer_id || '').trim() !== '');
  const apTrxRows = trxRows.filter(r => String(r.supplier_id || '').trim() !== '');

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
  ];

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
  if (arTrxRows.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(arTrxRows, { header: trxCols }), 'AR_Transactions');
  if (apTrxRows.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(apTrxRows, { header: trxCols }), 'AP_Transactions');
  if (analysisLineRows.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(analysisLineRows, { header: analysisLineCols }), 'LineAnalysis');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(qualityRows, { header: qualityCols }), 'Quality');

  const arrayBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([arrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
}
