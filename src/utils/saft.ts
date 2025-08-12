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

  const headerCols = ['file_version','software','software_ver','created','start','end'];
  const headerRows = data.header ? [{
    file_version: data.header.file_version ?? '',
    software: data.header.software ?? '',
    software_ver: data.header.software_ver ?? '',
    created: data.header.created ?? '',
    start: data.header.start ?? '',
    end: data.header.end ?? ''
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

  const bankCols = ['number','name','currency'];
  const bankRows = (data.bank_accounts || []).map(b => ({
    number: b.number ?? '',
    name: b.name ?? '',
    currency: b.currency ?? ''
  }));

  const accountsCols = ['account_id','description','type','opening_balance','closing_balance','vat_code'];
  const accountsRows = (data.accounts || []).map(a => ({
    account_id: a.account_id,
    description: a.description ?? '',
    type: a.type ?? '',
    opening_balance: a.opening_balance ?? '',
    closing_balance: a.closing_balance ?? '',
    vat_code: a.vat_code ?? ''
  }));

  const customersCols = ['id','name','vat','country','city','postal','street','balance_account'];
  const customersRows = (data.customers || []).map(c => ({
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
  const suppliersRows = (data.suppliers || []).map(s => ({
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
  const taxRows = (data.tax_table || []).map(t => ({
    tax_code: t.tax_code ?? '',
    description: t.description ?? '',
    percentage: t.percentage ?? '',
    exemption_reason: t.exemption_reason ?? '',
    declaration_period: t.declaration_period ?? '',
    valid_from: t.valid_from ?? '',
    valid_to: t.valid_to ?? ''
  }));

  const analysisTypeCols = ['analysis_type','description'];
  const analysisTypeRows = (data.analysis_types || []).map(a => ({
    analysis_type: a.analysis_type ?? '',
    description: a.description ?? ''
  }));

  const journalCols = ['journal_id','description','posting_date','journal_type','batch_id','system_id'];
  const journalRows = (data.journals || []).map(j => ({
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
  const trxRows = (data.transactions || []).map(t => {
    const debitRaw = t.debit ?? 0;
    const creditRaw = t.credit ?? 0;
    const vatDebitRaw = t.vat_debit ?? 0;
    const vatCreditRaw = t.vat_credit ?? 0;

    const debit = debitRaw ? Math.abs(debitRaw) : 0;
    const credit = creditRaw ? -Math.abs(creditRaw) : 0;
    const vat_debit = vatDebitRaw ? Math.abs(vatDebitRaw) : 0;
    const vat_credit = vatCreditRaw ? -Math.abs(vatCreditRaw) : 0;

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
      amount_currency: t.amount_currency ?? '',
      exchange_rate: t.exchange_rate ?? '',
      debit,
      credit,
      vat_code: t.vat_code ?? '',
      vat_rate: t.vat_rate ?? '',
      vat_base: t.vat_base ?? '',
      vat_debit,
      vat_credit
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
    byVat.set(key, current + (Number(r.vat_debit) || 0) + (Number(r.vat_credit) || 0));
  });
  const mvaOk = Array.from(byVat.values()).every(v => Math.abs(round2(v)) <= 0.01);
  const qualityCols = ['metric','value'];
  const qualityRows = [
    { metric: 'lines_total', value: trxRows.length },
    { metric: 'unique_voucher_no', value: new Set(trxRows.map(t => String(t.voucher_no || ''))).size },
    { metric: 'lines_with_tax_information', value: (data.transactions || []).filter(t => t.vat_info_source === 'line').length },
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
  if (analysisTypeRows.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(analysisTypeRows, { header: analysisTypeCols }), 'AnalysisTypes');
  if (journalRows.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(journalRows, { header: journalCols }), 'Journal');
  if (trxRows.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(trxRows, { header: trxCols }), 'Transactions');
  if (analysisLineRows.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(analysisLineRows, { header: analysisLineCols }), 'AnalysisLines');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(qualityRows, { header: qualityCols }), 'Quality');

  const arrayBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([arrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
}
