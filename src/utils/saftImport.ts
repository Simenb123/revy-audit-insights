import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import type { SaftResult } from './saftParser';
import { convertToNorwegian } from './accountTypeMapping';

function formatValueEU(val: any): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'number') {
    const s = String(val);
    return s.replace('.', ',');
  }
  const s = String(val);
  const needsQuotes = s.includes(';') || s.includes('"') || s.includes('\n');
  const esc = s.replace(/"/g, '""');
  return needsQuotes ? `"${esc}"` : esc;
}

function toCsv(headers: string[], rows: Record<string, any>[]): string {
  const lines: string[] = [];
  lines.push(headers.join(';'));
  for (const row of rows) {
    const cells = headers.map((h) => formatValueEU(row[h]));
    lines.push(cells.join(';'));
  }
  return lines.join('\n');
}

function sheetFrom(headers: string[], rows: Record<string, any>[]) {
  const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
  return ws;
}

function round2(n: number): number { return Math.round(n * 100) / 100; }

export async function createZipFromParsed(parsed: SaftResult): Promise<Blob> {
  const zip = new JSZip();

  // Build datasets in requested column order
  const headerCols = ['file_version','software','software_ver','created','start','end'];
  const headerRows = parsed.header ? [{
    file_version: parsed.header.file_version ?? '',
    software: parsed.header.software ?? '',
    software_ver: parsed.header.software_ver ?? '',
    created: parsed.header.created ?? '',
    start: parsed.header.start ?? '',
    end: parsed.header.end ?? ''
  }] : [];

  const companyCols = ['company_name','org_number','country','city','postal','street','email','telephone','currency_code'];
  const companyRows = parsed.company ? [{
    company_name: parsed.company.company_name ?? '',
    org_number: parsed.company.org_number ?? '',
    country: parsed.company.country ?? '',
    city: parsed.company.city ?? '',
    postal: parsed.company.postal ?? '',
    street: parsed.company.street ?? '',
    email: parsed.company.email ?? '',
    telephone: parsed.company.telephone ?? '',
    currency_code: parsed.company.currency_code ?? ''
  }] : [];

  const bankCols = ['number','name','currency'];
  const bankRows = (parsed.bank_accounts || []).map(b => ({
    number: b.number ?? '',
    name: b.name ?? '',
    currency: b.currency ?? ''
  }));

  const accountsCols = ['account_id','description','type','opening_balance','closing_balance','vat_code'];
  const accountsRows = (parsed.accounts || []).map(a => ({
    account_id: a.account_id,
    description: a.description ?? '',
    type: a.type ?? '',
    opening_balance: a.opening_balance ?? '',
    closing_balance: a.closing_balance ?? '',
    vat_code: a.vat_code ?? ''
  }));

  const customersCols = ['id','name','vat','country','city','postal','street','balance_account'];
  const customersRows = (parsed.customers || []).map(c => ({
    id: c.id ?? '',
    name: c.name ?? '',
    vat: c.vat ?? '',
    country: c.country ?? '',
    city: c.city ?? '',
    postal: c.postal ?? '',
    street: c.street ?? '',
    balance_account: c.balance_account ?? ''
  }));

  const suppliersCols = ['id','name','vat','country','city','postal','street','balance_account'];
  const suppliersRows = (parsed.suppliers || []).map(s => ({
    id: s.id ?? '',
    name: s.name ?? '',
    vat: s.vat ?? '',
    country: s.country ?? '',
    city: s.city ?? '',
    postal: s.postal ?? '',
    street: s.street ?? '',
    balance_account: s.balance_account ?? ''
  }));

  const taxCols = ['tax_code','description','percentage','exemption_reason','declaration_period','valid_from','valid_to'];
  const taxRows = (parsed.tax_table || []).map(t => ({
    tax_code: t.tax_code ?? '',
    description: t.description ?? '',
    percentage: t.percentage ?? '',
    exemption_reason: t.exemption_reason ?? '',
    declaration_period: t.declaration_period ?? '',
    valid_from: t.valid_from ?? '',
    valid_to: t.valid_to ?? ''
  }));

  const analysisTypeCols = ['analysis_type','description'];
  const analysisTypeRows = (parsed.analysis_types || []).map(a => ({
    analysis_type: a.analysis_type ?? '',
    description: a.description ?? ''
  }));

  const journalCols = ['journal_id','description','posting_date','journal_type','batch_id','system_id'];
  const journalRows = (parsed.journals || []).map(j => ({
    journal_id: j.journal_id ?? '',
    description: j.description ?? '',
    posting_date: j.posting_date ?? '',
    journal_type: j.journal_type ?? '',
    batch_id: j.batch_id ?? '',
    system_id: j.system_id ?? ''
  }));

  const trxCols = [
    'journal_id','record_id','voucher_no','posting_date',
    'account_id','description','customer_id','supplier_id','document_no','reference_no','value_date','due_date','cid',
    'currency','amount_currency','exchange_rate','debit','credit',
    'vat_code','vat_rate','vat_base','vat_debit','vat_credit'
  ];
  const trxRows = (parsed.transactions || []).map(t => ({
    journal_id: t.journal_id ?? '',
    record_id: t.record_id ?? '',
    voucher_no: t.voucher_no ?? '',
    posting_date: t.posting_date ?? '',
    account_id: t.account_id ?? '',
    description: t.description ?? '',
    customer_id: t.customer_id ?? '',
    supplier_id: t.supplier_id ?? '',
    document_no: t.document_no ?? '',
    reference_no: t.reference_no ?? '',
    value_date: t.value_date ?? '',
    due_date: t.due_date ?? '',
    cid: t.cid ?? '',
    currency: t.currency ?? '',
    amount_currency: t.amount_currency ?? '',
    exchange_rate: t.exchange_rate ?? '',
    debit: t.debit ?? '',
    credit: t.credit ?? '',
    vat_code: t.vat_code ?? '',
    vat_rate: t.vat_rate ?? '',
    vat_base: t.vat_base ?? '',
    vat_debit: t.vat_debit ?? '',
    vat_credit: t.vat_credit ?? ''
  }));

  const analysisLineCols = ['journal_id','record_id','analysis_type','analysis_id','debit_amt','credit_amt'];
  const analysisLineRows = (parsed.analysis_lines || []).map(a => ({
    journal_id: a.journal_id ?? '',
    record_id: a.record_id ?? '',
    analysis_type: a.analysis_type ?? '',
    analysis_id: a.analysis_id ?? '',
    debit_amt: a.debit_amt ?? '',
    credit_amt: a.credit_amt ?? ''
  }));

  // Data quality report
  const sum = (ns: (number | undefined)[]) => ns.reduce((acc, v) => acc + (v ?? 0), 0);
  const totalDebit = sum((parsed.transactions || []).map(t => t.debit));
  const totalCredit = sum((parsed.transactions || []).map(t => t.credit));
  const balanceDiff = round2((totalDebit || 0) - (totalCredit || 0));
  const balanceOk = Math.abs(balanceDiff) <= 0.01;

  const byJournal = new Map<string, { debit: number; credit: number }>();
  (parsed.transactions || []).forEach(t => {
    const key = t.journal_id || '';
    const rec = byJournal.get(key) || { debit: 0, credit: 0 };
    rec.debit += t.debit ?? 0;
    rec.credit += t.credit ?? 0;
    byJournal.set(key, rec);
  });
  const journalsOk = Array.from(byJournal.values()).every(v => Math.abs(round2(v.debit - v.credit)) <= 0.01);

  const byVat = new Map<string, { vat_debit: number; vat_credit: number }>();
  (parsed.transactions || []).forEach(t => {
    const key = t.vat_code || '';
    const rec = byVat.get(key) || { vat_debit: 0, vat_credit: 0 };
    rec.vat_debit += t.vat_debit ?? 0;
    rec.vat_credit += t.vat_credit ?? 0;
    byVat.set(key, rec);
  });
  const mvaOk = Array.from(byVat.values()).every(v => Math.abs(round2(v.vat_debit - v.vat_credit)) <= 0.01);

  const qualityCols = ['metric','value'];
  const qualityRows = [
    { metric: 'lines_total', value: (parsed.transactions || []).length },
    { metric: 'unique_voucher_no', value: new Set((parsed.transactions || []).map(t => t.voucher_no || '')).size },
    { metric: 'lines_with_tax_information', value: (parsed.transactions || []).filter(t => t.vat_info_source === 'line').length },
    { metric: 'balance_ok', value: balanceOk && journalsOk ? 'true' : 'false' },
    { metric: 'balance_diff_total', value: balanceDiff },
    { metric: 'mva_ok', value: mvaOk ? 'true' : 'false' },
  ];

  // CSV files (semicolon-separated, comma decimals handled in formatValueEU)
  zip.file('header.csv', toCsv(headerCols, headerRows));
  zip.file('company.csv', toCsv(companyCols, companyRows));
  zip.file('bank_accounts.csv', toCsv(bankCols, bankRows));
  zip.file('accounts.csv', toCsv(accountsCols, accountsRows));
  zip.file('customers.csv', toCsv(customersCols, customersRows));
  zip.file('suppliers.csv', toCsv(suppliersCols, suppliersRows));
  zip.file('tax_table.csv', toCsv(taxCols, taxRows));
  zip.file('analysis_types.csv', toCsv(analysisTypeCols, analysisTypeRows));
  zip.file('journal.csv', toCsv(journalCols, journalRows));
  zip.file('transactions.csv', toCsv(trxCols, trxRows));
  zip.file('analysis_lines.csv', toCsv(analysisLineCols, analysisLineRows));
  zip.file('quality.csv', toCsv(qualityCols, qualityRows));

  // XLSX workbook (one sheet per CSV)
  const wb = XLSX.utils.book_new();
  if (headerRows.length) XLSX.utils.book_append_sheet(wb, sheetFrom(headerCols, headerRows), 'Header');
  if (companyRows.length) XLSX.utils.book_append_sheet(wb, sheetFrom(companyCols, companyRows), 'Company');
  if (bankRows.length) XLSX.utils.book_append_sheet(wb, sheetFrom(bankCols, bankRows), 'BankAccounts');
  if (accountsRows.length) XLSX.utils.book_append_sheet(wb, sheetFrom(accountsCols, accountsRows), 'Accounts');
  if (customersRows.length) XLSX.utils.book_append_sheet(wb, sheetFrom(customersCols, customersRows), 'Customers');
  if (suppliersRows.length) XLSX.utils.book_append_sheet(wb, sheetFrom(suppliersCols, suppliersRows), 'Suppliers');
  if (taxRows.length) XLSX.utils.book_append_sheet(wb, sheetFrom(taxCols, taxRows), 'TaxTable');
  if (analysisTypeRows.length) XLSX.utils.book_append_sheet(wb, sheetFrom(analysisTypeCols, analysisTypeRows), 'AnalysisTypes');
  if (journalRows.length) XLSX.utils.book_append_sheet(wb, sheetFrom(journalCols, journalRows), 'Journal');
  if (trxRows.length) XLSX.utils.book_append_sheet(wb, sheetFrom(trxCols, trxRows), 'Transactions');
  if (analysisLineRows.length) XLSX.utils.book_append_sheet(wb, sheetFrom(analysisLineCols, analysisLineRows), 'AnalysisLines');
  const xlsxBuf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  zip.file('SAF-T.xlsx', xlsxBuf);

  return zip.generateAsync({ type: 'blob' });
}

export async function persistParsed(clientId: string, parsed: SaftResult): Promise<void> {
  // Upsert accounts into client_chart_of_accounts
  const accountRows = parsed.accounts.map(a => {
    const derivedType = convertToNorwegian(String((a as any).account_type ?? (a as any).type ?? ''));
    return {
      client_id: clientId,
      account_number: a.account_id,
      account_name: a.description || a.account_id,
      account_type: derivedType,
      is_active: true
    };
  });

  const { data: inserted, error: accError } = await supabase
    .from('client_chart_of_accounts')
    .upsert(accountRows)
    .select('id, account_number');

  if (accError) throw accError;

  const accountMap = new Map<string, string>();
  inserted?.forEach((row: any) => accountMap.set(row.account_number, row.id));

  // Insert transactions
  const txRows = parsed.transactions
    .map(t => {
      const accountId = t.account_id ? accountMap.get(t.account_id) : undefined;
      if (!accountId) return null;
      const date = t.posting_date ? new Date(t.posting_date) : new Date();
      return {
        client_id: clientId,
        client_account_id: accountId,
        transaction_date: date.toISOString().split('T')[0],
        period_year: date.getFullYear(),
        period_month: date.getMonth() + 1,
        voucher_number: t.voucher_no || null,
        description: t.description || '',
        debit_amount: t.debit || 0,
        credit_amount: t.credit || 0,
        balance_amount: (t.debit || 0) - (t.credit || 0)
      };
    })
    .filter(Boolean) as any[];

  if (txRows.length) {
    const { error: txError } = await supabase
      .from('general_ledger_transactions')
      .insert(txRows);
    if (txError) throw txError;
  }
}

export async function uploadZipToStorage(clientId: string, zip: Blob, fileName: string): Promise<string> {
  const path = `${clientId}/${fileName}`;
  const { error } = await supabase.storage
    .from('saft-imports')
    .upload(path, zip, {
      upsert: true,
      contentType: 'application/zip'
    });
  if (error) throw error;
  return path;
}
