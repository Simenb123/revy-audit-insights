import JSZip from 'jszip'; // used only for ZIP packaging, keep in sync with XLSX sheets
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

  // Compute period start/end per journal from raw transactions
  const journalDateMap = new Map<string, { start?: string; end?: string }>();
  (parsed.transactions || []).forEach(t => {
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
  const journalRows = (parsed.journals || []).map(j => ({
    journal_id: j.journal_id ?? '',
    description: j.description ?? '',
    posting_date: j.posting_date ?? '',
    journal_type: j.journal_type ?? '',
    batch_id: j.batch_id ?? '',
    system_id: j.system_id ?? '',
    period_start: (journalDateMap.get(String(j.journal_id || '')) || {}).start ?? '',
    period_end: (journalDateMap.get(String(j.journal_id || '')) || {}).end ?? ''
  }));

  const trxCols = [
    'journal_id','record_id','voucher_no','posting_date',
    'account_id','description','customer_id','supplier_id','document_no','reference_no','value_date','due_date','cid',
    'currency','amount_currency','exchange_rate','debit','credit',
    'vat_code','vat_rate','vat_base','vat_debit','vat_credit','amount'
  ];
  const trxRows = (parsed.transactions || []).map(t => {
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
      amount_currency: t.amount_currency,
      exchange_rate: t.exchange_rate,
      debit,
      credit,
      vat_code: t.vat_code ?? '',
      vat_rate: t.vat_rate ?? '',
      vat_base: t.vat_base,
      vat_debit,
      vat_credit,
      amount
    };
  });

  const analysisLineCols = ['journal_id','record_id','analysis_type','analysis_id','debit_amt','credit_amt'];
  const analysisLineRows = (parsed.analysis_lines || []).map(a => ({
    journal_id: a.journal_id ?? '',
    record_id: a.record_id ?? '',
    analysis_type: a.analysis_type ?? '',
    analysis_id: a.analysis_id ?? '',
    debit_amt: a.debit_amt ?? '',
    credit_amt: a.credit_amt ?? ''
  }));

  // Data quality report (use signed amounts: debit positive, credit negative)
  const sum = (ns: number[]) => ns.reduce((acc, v) => acc + (v ?? 0), 0);
  const totalSigned = round2(sum(trxRows.map(r => (Number(r.debit) || 0) + (Number(r.credit) || 0))));
  const balanceOk = Math.abs(totalSigned) <= 0.01;

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
    // Normalize signs: debit positive, credit negative for VAT totals
    byVat.set(key, current + Math.abs(Number(r.vat_debit) || 0) - Math.abs(Number(r.vat_credit) || 0));
  });
  const mvaOk = Array.from(byVat.values()).every(v => Math.abs(round2(v)) <= 0.01);

  // AR/AP filtered transactions
  const arTrxRows = trxRows.filter(r => String(r.customer_id || '').trim() !== '');
  const apTrxRows = trxRows.filter(r => String(r.supplier_id || '').trim() !== '');

  const qualityCols = ['metric','value'];
  const qualityRows = [
    { metric: 'lines_total', value: trxRows.length },
    { metric: 'ar_lines_total', value: arTrxRows.length },
    { metric: 'ap_lines_total', value: apTrxRows.length },
    { metric: 'unique_customers_in_ar', value: new Set(arTrxRows.map(t => String(t.customer_id || ''))).size },
    { metric: 'unique_suppliers_in_ap', value: new Set(apTrxRows.map(t => String(t.supplier_id || ''))).size },
    { metric: 'unique_voucher_no', value: new Set(trxRows.map(t => String(t.voucher_no || ''))).size },
    { metric: 'lines_with_document_fields', value: trxRows.filter(r => String(r.document_no || r.reference_no || '').trim() !== '' ).length },
    { metric: 'lines_with_tax_information', value: (parsed.transactions || []).filter(t => t.vat_info_source === 'line').length },
    { metric: 'debit_rows_nonzero', value: trxRows.filter(r => (Number(r.debit) || 0) !== 0).length },
    { metric: 'credit_rows_nonzero', value: trxRows.filter(r => (Number(r.credit) || 0) !== 0).length },
    { metric: 'sum_signed_total', value: totalSigned },
    { metric: 'balance_ok', value: balanceOk && journalsOk ? 'true' : 'false' },
    { metric: 'balance_diff_total', value: totalSigned },
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
  zip.file('ar_transactions.csv', toCsv(trxCols, arTrxRows));
  zip.file('ap_transactions.csv', toCsv(trxCols, apTrxRows));
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
  if (arTrxRows.length) XLSX.utils.book_append_sheet(wb, sheetFrom(trxCols, arTrxRows), 'AR_Transactions');
  if (apTrxRows.length) XLSX.utils.book_append_sheet(wb, sheetFrom(trxCols, apTrxRows), 'AP_Transactions');
  if (analysisLineRows.length) XLSX.utils.book_append_sheet(wb, sheetFrom(analysisLineCols, analysisLineRows), 'AnalysisLines');
  const xlsxBuf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  zip.file('SAF-T.xlsx', xlsxBuf);

  return zip.generateAsync({ type: 'blob' });
}

export async function persistParsed(clientId: string, parsed: SaftResult, fileName?: string): Promise<{ arCount: number; apCount: number }> {
  // Create upload batch for tracking this SAF-T import
  const { data: uploadBatch, error: batchError } = await supabase
    .from('upload_batches')
    .insert({
      client_id: clientId,
      file_name: fileName || 'SAF-T import',
      batch_type: 'saft',
      status: 'processing',
      total_records: parsed.transactions?.length || 0,
      processed_records: 0
    })
    .select('id')
    .single();

  if (batchError) throw batchError;
  const uploadBatchId = uploadBatch.id;

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

  const { error: accError } = await supabase
    .from('client_chart_of_accounts')
    .upsert(accountRows, { onConflict: 'client_id,account_number' });

  if (accError) throw accError;

  // Always fetch the IDs for all involved accounts to avoid empty returns on no-op upserts
  const allAccountNumbers = parsed.accounts.map(a => a.account_id);
  const { data: accountsAll, error: fetchAccErr } = await supabase
    .from('client_chart_of_accounts')
    .select('id, account_number')
    .eq('client_id', clientId)
    .in('account_number', allAccountNumbers);
  if (fetchAccErr) throw fetchAccErr;

  const accountMap = new Map<string, string>();
  (accountsAll || []).forEach((row: any) => accountMap.set(row.account_number, row.id));

  // Derive period dates
  const parseISO = (s?: string) => {
    if (!s) return null;
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  };
  const headerStart = parseISO((parsed as any).header?.start);
  const headerEnd = parseISO((parsed as any).header?.end);
  const trxDates = (parsed.transactions || [])
    .map(t => parseISO((t as any).posting_date))
    .filter((d): d is Date => !!d);

  const minTrxDate = trxDates.length ? new Date(Math.min(...trxDates.map(d => d.getTime()))) : null;
  const maxTrxDate = trxDates.length ? new Date(Math.max(...trxDates.map(d => d.getTime()))) : null;

  const periodStart = headerStart || minTrxDate || null;
  const periodEnd = headerEnd || maxTrxDate || headerStart || minTrxDate || new Date();

  const toDateString = (d: Date | null) => d ? d.toISOString().split('T')[0] : null;
  const period_start_date = toDateString(periodStart) || `${periodEnd.getFullYear()}-01-01`;
  const period_end_date = toDateString(periodEnd) || `${periodEnd.getFullYear()}-12-31`;
  const period_year = periodEnd.getFullYear();

  // Prepare GL rows
  const txRows = (parsed.transactions || [])
    .map(t => {
      const accountId = t.account_id ? accountMap.get(t.account_id) : undefined;
      if (!accountId) return null;
      const dateObj = t.posting_date ? new Date(t.posting_date) : periodEnd;
      const debit = t.debit !== undefined ? Math.abs(Number(t.debit) || 0) : 0;
      const credit = t.credit !== undefined ? Math.abs(Number(t.credit) || 0) : 0;
      const balance = debit - credit;
      const vat_rate = t.vat_rate !== undefined && t.vat_rate !== null && t.vat_rate !== '' ? Number(t.vat_rate) : null;
      const vat_base = t.vat_base !== undefined && t.vat_base !== null ? Number(t.vat_base) : null;
      // Normalize VAT: debit positive, credit positive number stored separately
      const vat_debit = t.vat_debit !== undefined && t.vat_debit !== null ? Math.abs(Number(t.vat_debit) || 0) : null;
      const vat_credit = t.vat_credit !== undefined && t.vat_credit !== null ? Math.abs(Number(t.vat_credit) || 0) : null;
      return {
        client_id: clientId,
        client_account_id: accountId,
        transaction_date: dateObj.toISOString().split('T')[0],
        period_year: dateObj.getFullYear(),
        period_month: dateObj.getMonth() + 1,
        voucher_number: (t as any).voucher_no || (t as any).voucher_number || null,
        description: t.description || '',
        debit_amount: debit || null,
        credit_amount: credit || null,
        balance_amount: balance,
        // New AR/AP and document fields
        customer_id: (t as any).customer_id || null,
        supplier_id: (t as any).supplier_id || null,
        document_number: (t as any).document_no || (t as any).document_number || null,
        reference_number: (t as any).reference_no || (t as any).reference_number || null,
        value_date: toDateString(parseISO((t as any).value_date)),
        due_date: toDateString(parseISO((t as any).due_date)),
        cid: (t as any).cid || null,
        // Currency
        currency_code: (t as any).currency || null,
        amount_currency: t.amount_currency ?? null,
        exchange_rate: t.exchange_rate ?? null,
        // VAT fields
        vat_code: (t as any).vat_code ?? null,
        vat_rate,
        vat_base,
        vat_debit,
        vat_credit,
      };
    })
    .filter(Boolean) as any[];

  const totalTransactions = txRows.length;
  const totalDebitAmount = txRows.reduce((s, r) => s + (r.debit_amount || 0), 0);
  const totalCreditAmount = txRows.reduce((s, r) => s + (r.credit_amount || 0), 0);
  const balanceDifference = Math.round(((totalDebitAmount - totalCreditAmount) + Number.EPSILON) * 100) / 100;

  // Create version but don't activate yet
  let versionId: string | null = null;
  let versionNumber: number | null = null;
  {
    const { data: nextNum, error: verErr } = await supabase.rpc('get_next_version_number', { p_client_id: clientId });
    if (verErr) throw verErr;
    versionNumber = nextNum as number;
    const { data: version, error: insErr } = await supabase
      .from('accounting_data_versions')
      .insert({
        client_id: clientId,
        version_number: versionNumber,
        file_name: fileName || 'SAF-T import',
        upload_batch_id: uploadBatchId,
        total_transactions: totalTransactions,
        total_debit_amount: totalDebitAmount,
        total_credit_amount: totalCreditAmount,
        balance_difference: balanceDifference,
        metadata: {
          source: 'saft',
          period_start_date,
          period_end_date
        }
      })
      .select('*')
      .single();
    if (insErr) throw insErr;
    versionId = version.id;
  }

  // Insert GL with version_id and upload_batch_id
  let insertedTransactions = 0;
  if (txRows.length) {
    const rowsWithVersion = txRows.map(r => ({ ...r, version_id: versionId, upload_batch_id: uploadBatchId }));
    const { data, error: txError } = await supabase
      .from('general_ledger_transactions')
      .insert(rowsWithVersion)
      .select();
    if (txError) throw txError;
    insertedTransactions = data?.length || 0;
  }

  // Aggregate debit/credit per account for TB
  const sums = new Map<string, { debit: number; credit: number }>();
  txRows.forEach(r => {
    const key = r.client_account_id as string;
    const s = sums.get(key) || { debit: 0, credit: 0 };
    s.debit += r.debit_amount || 0;
    s.credit += r.credit_amount || 0;
    sums.set(key, s);
  });

  // Insert trial balances from Accounts
  const tbRows = (parsed.accounts || [])
    .map(a => {
      const accountId = a.account_id ? accountMap.get(a.account_id) : undefined;
      if (!accountId) return null;
      const s = sums.get(accountId) || { debit: 0, credit: 0 };
      return {
        client_id: clientId,
        client_account_id: accountId,
        opening_balance: a.opening_balance ?? 0,
        closing_balance: a.closing_balance ?? 0,
        debit_turnover: s.debit,
        credit_turnover: s.credit,
        period_start_date,
        period_end_date,
        period_year,
        version: versionNumber ? `v${versionNumber}` : 'v1'
      };
    })
    .filter(Boolean) as any[];

  if (tbRows.length) {
    const { error: tbError } = await supabase
      .from('trial_balances')
      .insert(tbRows);
    if (tbError) throw tbError;
  }

  // Derive AR/AP transactions from the imported general ledger
  let arCount = 0;
  let apCount = 0;
  
  if (insertedTransactions > 0) {
    console.log(`Deriving AR/AP from ${insertedTransactions} transactions for upload_batch_id: ${uploadBatchId}`);
    
    try {
      const { data: arApResult, error: arApError } = await supabase.functions.invoke('derive-ar-ap', {
        body: { upload_batch_id: uploadBatchId }
      });

      if (arApError) {
        console.error('Error deriving AR/AP:', arApError);
        // Don't fail the entire import - log error and continue
      } else if (arApResult) {
        arCount = arApResult.ar || 0;
        apCount = arApResult.ap || 0;
        console.log(`Successfully derived ${arCount} AR and ${apCount} AP transactions`);
      }
    } catch (error) {
      console.error('Error calling derive-ar-ap function:', error);
      // Don't fail the entire import - log error and continue
    }
  }

  // Update upload batch status
  await supabase
    .from('upload_batches')
    .update({
      status: 'completed',
      processed_records: insertedTransactions
    })
    .eq('id', uploadBatchId);

  // Only set version as active after successful data insertion
  if (insertedTransactions > 0 && versionId) {
    await supabase.rpc('set_active_version', { p_version_id: versionId });
  } else {
    throw new Error('No transactions were inserted successfully');
  }

  return { arCount, apCount };
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

export async function uploadXlsxToStorage(clientId: string, xlsx: Blob, fileName: string): Promise<string> {
  const path = `${clientId}/${fileName}`;
  const { error } = await supabase.storage
    .from('saft-imports')
    .upload(path, xlsx, {
      upsert: true,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
  if (error) throw error;
  return path;
}
