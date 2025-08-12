import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';

export interface SaftAccount {
  account_id: string;
  description?: string;
  opening_balance?: number;
  closing_balance?: number;
  vat_code?: string;
}

export interface SaftTransaction {
  journal_id?: string;
  record_id?: string;
  voucher_no?: string;
  account_id?: string;
  description?: string;
  debit?: number;
  credit?: number;
  vat_code?: string;
  vat_rate?: string;
  posting_date?: string;
}

export interface SaftResult {
  accounts: SaftAccount[];
  journals: any[];
  transactions: SaftTransaction[];
}

function isZip(buffer: ArrayBuffer): boolean {
  const sig = new Uint8Array(buffer.slice(0, 4));
  return sig[0] === 0x50 && sig[1] === 0x4b;
}

function arr<T>(v: T | T[] | undefined): T[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function parseDecimal(value: any): number | undefined {
  if (value === undefined || value === null) return undefined;
  const n = parseFloat(String(value).replace(/\s+/g, '').replace(',', '.'));
  return isNaN(n) ? undefined : n;
}

export async function parseSaftFile(file: File | ArrayBuffer): Promise<SaftResult> {
  const buffer = file instanceof File ? await file.arrayBuffer() : file;
  let xmlText: string;

  if (isZip(buffer)) {
    const zip = await JSZip.loadAsync(buffer);
    const xmlName = Object.keys(zip.files).find(n => n.toLowerCase().endsWith('.xml'));
    if (!xmlName) throw new Error('Finner ikke XML-fil i SAF-T arkivet');
    xmlText = await zip.files[xmlName].async('text');
  } else {
    xmlText = new TextDecoder().decode(buffer);
  }

  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
  const parsed = parser.parse(xmlText);
  const root = parsed?.AuditFile;
  if (!root) throw new Error('Ugyldig SAF-T fil');

  const accounts: SaftAccount[] = arr(root?.MasterFiles?.GeneralLedgerAccounts?.Account).map((a: any) => ({
    account_id: a.AccountID,
    description: a.AccountDescription || a.Description || a.Name,
    opening_balance: parseDecimal(a.OpeningDebitBalance ?? a.OpeningCreditBalance ?? a.OpeningBalance),
    closing_balance: parseDecimal(a.ClosingDebitBalance ?? a.ClosingCreditBalance ?? a.ClosingBalance),
    vat_code: a.VatCode || a.VATCode || a.TaxCode || a.StandardVatCode,
  }));

  const journals: any[] = [];
  const transactions: SaftTransaction[] = [];

  arr(root?.GeneralLedgerEntries?.Journal).forEach((j: any) => {
    const journalId = j.JournalID;
    journals.push({
      journal_id: journalId,
      description: j.Description || j.Name,
      posting_date: j.PostingDate || j.VoucherDate,
    });
    arr(j.Transaction).forEach((t: any) => {
      const voucherNo = t.VoucherNo || t.VoucherID || journalId;
      const transactionDate = t.TransactionDate || t.DocumentDate;
      arr(t.Line || t.TransactionLine || t.JournalLine).forEach((l: any) => {
        const dc = String(l.DebitCredit || '').toLowerCase();
        const amt = parseDecimal(l.Amount);
        const debit = parseDecimal(l.DebitAmount) ?? (dc.startsWith('d') ? amt : undefined);
        const credit = parseDecimal(l.CreditAmount) ?? (dc.startsWith('c') ? amt : undefined);
        transactions.push({
          journal_id: journalId,
          record_id: l.RecordID,
          voucher_no: voucherNo,
          account_id: l.AccountID,
          description: l.Description || l.Text || l.Name,
          debit,
          credit,
          vat_code: l.VatCode || l.VATCode || l.TaxCode || l.StandardVatCode,
          vat_rate: l.TaxPercentageDecimal || l.TaxPercentage,
          posting_date: transactionDate,
        } as any);
      });
    });
  });

  return { accounts, journals, transactions };
}
