import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';

export interface SaftAccount {
  account_id: string;
  description?: string;
  type?: string;
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
  customer_id?: string;
  supplier_id?: string;
  document_no?: string;
  reference_no?: string;
  value_date?: string;
  due_date?: string;
  cid?: string;
  currency?: string;
  amount_currency?: number;
  exchange_rate?: number;
  debit?: number;
  credit?: number;
  vat_code?: string;
  vat_rate?: number | string;
  vat_base?: number;
  vat_debit?: number;
  vat_credit?: number;
  posting_date?: string;
  vat_info_source?: 'line' | 'fallback' | undefined;
}

export interface HeaderInfo {
  file_version?: string;
  software?: string;
  software_ver?: string;
  created?: string;
  start?: string;
  end?: string;
}

export interface CompanyInfo {
  company_name?: string;
  org_number?: string;
  country?: string;
  city?: string;
  postal?: string;
  street?: string;
  email?: string;
  telephone?: string;
  currency_code?: string;
}

export interface BankAccountInfo {
  number?: string;
  name?: string;
  currency?: string;
}

export interface CustomerInfo {
  id?: string;
  name?: string;
  vat?: string;
  country?: string;
  city?: string;
  postal?: string;
  street?: string;
  balance_account?: string;
}

export interface SupplierInfo {
  id?: string;
  name?: string;
  vat?: string;
  country?: string;
  city?: string;
  postal?: string;
  street?: string;
  balance_account?: string;
}

export interface TaxTableEntry {
  tax_code?: string;
  description?: string;
  percentage?: number | string;
  exemption_reason?: string;
  declaration_period?: string;
  valid_from?: string;
  valid_to?: string;
}

export interface AnalysisTypeInfo {
  analysis_type?: string;
  description?: string;
}

export interface AnalysisLineInfo {
  journal_id?: string;
  record_id?: string;
  analysis_type?: string;
  analysis_id?: string;
  debit_amt?: number;
  credit_amt?: number;
}

export interface JournalInfo {
  journal_id?: string;
  description?: string;
  posting_date?: string;
  journal_type?: string;
  batch_id?: string;
  system_id?: string;
}

export interface SaftResult {
  header: HeaderInfo | null;
  company: CompanyInfo | null;
  bank_accounts: BankAccountInfo[];
  accounts: SaftAccount[];
  customers: CustomerInfo[];
  suppliers: SupplierInfo[];
  tax_table: TaxTableEntry[];
  analysis_types: AnalysisTypeInfo[];
  journals: JournalInfo[];
  transactions: SaftTransaction[];
  analysis_lines: AnalysisLineInfo[];
}

function isZip(buffer: ArrayBuffer): boolean {
  const sig = new Uint8Array(buffer.slice(0, 4));
  return sig[0] === 0x50 && sig[1] === 0x4b;
}

function arr<T>(v: T | T[] | undefined | null): T[] {
  if (v === undefined || v === null) return [];
  return Array.isArray(v) ? v : [v];
}

function parseDecimal(value: any): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const n = parseFloat(String(value).replace(/\s+/g, '').replace(',', '.'));
  return isNaN(n) ? undefined : n;
}

// Get a property by localName (ignore namespace prefixes like ns2:)
function byLocal(obj: any, localName: string): any {
  if (!obj || typeof obj !== 'object') return undefined;
  const key = Object.keys(obj).find(
    (k) => k === localName || k.endsWith(':' + localName) || k.split(':').pop() === localName
  );
  return key ? (obj as any)[key] : undefined;
}

function parseAmountNode(value: any): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseDecimal(value);
  if (typeof value === 'object') {
    const inner = byLocal(value, 'Amount') ?? (value as any).Amount ?? (value as any).amount ?? (value as any)['#text'];
    return parseAmountNode(inner);
  }
  return undefined;
}

async function readLargestXmlFromZip(buffer: ArrayBuffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const xmlNames = Object.keys(zip.files).filter((n) => n.toLowerCase().endsWith('.xml'));
  if (xmlNames.length === 0) throw new Error('Finner ikke XML-fil i SAF-T arkivet');
  // Read all XML files, choose the one with largest text length
  const contents = await Promise.all(xmlNames.map((name) => zip.files[name].async('text')));
  let maxIdx = 0;
  for (let i = 1; i < contents.length; i++) {
    if (contents[i].length > contents[maxIdx].length) maxIdx = i;
  }
  return contents[maxIdx];
}

export async function parseSaftFile(file: File | ArrayBuffer): Promise<SaftResult> {
  const buffer = file instanceof File ? await file.arrayBuffer() : file;
  let xmlText: string;

  if (isZip(buffer)) {
    xmlText = await readLargestXmlFromZip(buffer);
  } else {
    xmlText = new TextDecoder().decode(buffer);
  }

  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
  const parsed = parser.parse(xmlText);
  // Namespace agnostic root lookup
  const root = byLocal(parsed, 'AuditFile');
  if (!root) throw new Error('Ugyldig SAF-T fil');

  // Header / FileHeader
  const headerNode = byLocal(root, 'Header') || byLocal(root, 'FileHeader');
  const softwareCompany = byLocal(headerNode, 'SoftwareCompanyName');
  const softwareProduct = byLocal(headerNode, 'SoftwareProductName');
  const softwareCombined = [softwareCompany, softwareProduct].filter(Boolean).join(' ');

  const header: HeaderInfo | null = headerNode
    ? {
        file_version:
          byLocal(headerNode, 'AuditFileVersion') ||
          byLocal(headerNode, 'FileVersion') ||
          byLocal(headerNode, 'Version'),
        software: softwareCombined || byLocal(headerNode, 'Software') || undefined,
        software_ver: byLocal(headerNode, 'SoftwareVersion') || byLocal(headerNode, 'ProductVersion'),
        created: byLocal(headerNode, 'DateCreated') || byLocal(headerNode, 'CreatedDate'),
        start: byLocal(headerNode, 'StartDate') || byLocal(headerNode, 'PeriodStart'),
        end: byLocal(headerNode, 'EndDate') || byLocal(headerNode, 'PeriodEnd'),
      }
    : null;

  // Company from Header
  const companyNode = byLocal(headerNode, 'Company') || byLocal(headerNode, 'Entity');
  const compAddr = byLocal(companyNode, 'Address') || byLocal(companyNode, 'CompanyAddress');
  const company: CompanyInfo | null = companyNode
    ? {
        company_name:
          byLocal(companyNode, 'CompanyName') || byLocal(companyNode, 'Name') || byLocal(companyNode, 'EntityName'),
        org_number:
          byLocal(companyNode, 'TaxRegistrationNumber') ||
          byLocal(companyNode, 'CompanyID') ||
          byLocal(companyNode, 'RegistrationNumber'),
        country: byLocal(compAddr, 'Country') || byLocal(compAddr, 'CountryCode'),
        city: byLocal(compAddr, 'City') || byLocal(compAddr, 'Town'),
        postal: byLocal(compAddr, 'PostalCode') || byLocal(compAddr, 'PostCode'),
        street: byLocal(compAddr, 'StreetName') || byLocal(compAddr, 'AddressLine1') || byLocal(compAddr, 'AddressDetail'),
        email: byLocal(companyNode, 'Email') || byLocal(companyNode, 'EmailAddress'),
        telephone: byLocal(companyNode, 'Telephone') || byLocal(companyNode, 'Phone'),
        currency_code: byLocal(headerNode, 'DefaultCurrencyCode') || byLocal(companyNode, 'CurrencyCode'),
      }
    : null;

  // MasterFiles
  const master = byLocal(root, 'MasterFiles');

  // Bank accounts
  const bankAccountsRaw =
    byLocal(master, 'BankAccounts') || byLocal(master, 'BankAccount') || byLocal(master, 'Banks');
  const bank_accounts: BankAccountInfo[] = arr(byLocal(bankAccountsRaw, 'BankAccount') || bankAccountsRaw).map(
    (b: any) => ({
      number: byLocal(b, 'IBAN') || byLocal(b, 'AccountNumber') || byLocal(b, 'BankAccountNumber'),
      name: byLocal(b, 'AccountName') || byLocal(b, 'Name') || byLocal(b, 'Description'),
      currency: byLocal(b, 'CurrencyCode') || byLocal(b, 'Currency'),
    })
  );

  // Accounts
  const accounts: SaftAccount[] = arr(byLocal(byLocal(master, 'GeneralLedgerAccounts'), 'Account')).map((a: any) => {
    const openingDebit = parseAmountNode(byLocal(a, 'OpeningDebitBalance'));
    const openingCredit = parseAmountNode(byLocal(a, 'OpeningCreditBalance'));
    const closingDebit = parseAmountNode(byLocal(a, 'ClosingDebitBalance'));
    const closingCredit = parseAmountNode(byLocal(a, 'ClosingCreditBalance'));

    const opening_balance = (openingDebit !== undefined || openingCredit !== undefined)
      ? (openingDebit || 0) - (openingCredit || 0)
      : parseAmountNode(byLocal(a, 'OpeningBalance'));

    const closing_balance = (closingDebit !== undefined || closingCredit !== undefined)
      ? (closingDebit || 0) - (closingCredit || 0)
      : parseAmountNode(byLocal(a, 'ClosingBalance'));

    return {
      account_id: byLocal(a, 'AccountID') || byLocal(a, 'AccountNumber') || byLocal(a, 'Number'),
      description: byLocal(a, 'AccountDescription') || byLocal(a, 'Description') || byLocal(a, 'Name'),
      type: byLocal(a, 'AccountType') || byLocal(a, 'Type'),
      opening_balance,
      closing_balance,
      vat_code: byLocal(a, 'VatCode') || byLocal(a, 'VATCode') || byLocal(a, 'TaxCode') || byLocal(a, 'StandardVatCode'),
    } as SaftAccount;
  });

  // Customers
  const customersRaw =
    arr(byLocal(master, 'Customers'))
      .flatMap((c: any) => arr(byLocal(c, 'Customer')))
      .concat(arr(byLocal(master, 'Customer')));
  const customers: CustomerInfo[] = customersRaw.map((c: any) => {
    const addr = byLocal(c, 'Address') || byLocal(c, 'BillingAddress');
    return {
      id: byLocal(c, 'CustomerID') || byLocal(c, 'ID'),
      name: byLocal(c, 'CustomerName') || byLocal(c, 'Name'),
      vat: byLocal(c, 'TaxRegistrationNumber') || byLocal(c, 'VATNumber') || byLocal(c, 'TaxID'),
      country: byLocal(addr, 'Country') || byLocal(addr, 'CountryCode'),
      city: byLocal(addr, 'City') || byLocal(addr, 'Town'),
      postal: byLocal(addr, 'PostalCode') || byLocal(addr, 'PostCode'),
      street: byLocal(addr, 'StreetName') || byLocal(addr, 'AddressLine1') || byLocal(addr, 'AddressDetail'),
      balance_account:
        byLocal(c, 'BalanceAccount') || byLocal(c, 'ReceivableAccount') || byLocal(c, 'GeneralLedgerAccountID'),
    };
  });

  // Suppliers
  const suppliersRaw =
    arr(byLocal(master, 'Suppliers'))
      .flatMap((s: any) => arr(byLocal(s, 'Supplier')))
      .concat(arr(byLocal(master, 'Supplier')));
  const suppliers: SupplierInfo[] = suppliersRaw.map((s: any) => {
    const addr = byLocal(s, 'Address') || byLocal(s, 'BillingAddress');
    return {
      id: byLocal(s, 'SupplierID') || byLocal(s, 'ID'),
      name: byLocal(s, 'SupplierName') || byLocal(s, 'Name'),
      vat: byLocal(s, 'TaxRegistrationNumber') || byLocal(s, 'VATNumber') || byLocal(s, 'TaxID'),
      country: byLocal(addr, 'Country') || byLocal(addr, 'CountryCode'),
      city: byLocal(addr, 'City') || byLocal(addr, 'Town'),
      postal: byLocal(addr, 'PostalCode') || byLocal(addr, 'PostCode'),
      street: byLocal(addr, 'StreetName') || byLocal(addr, 'AddressLine1') || byLocal(addr, 'AddressDetail'),
      balance_account:
        byLocal(s, 'BalanceAccount') || byLocal(s, 'PayableAccount') || byLocal(s, 'GeneralLedgerAccountID'),
    };
  });

  // Tax table
  const taxTableRaw = byLocal(master, 'TaxTable') || byLocal(master, 'Taxes');
  const taxEntries =
    arr(byLocal(taxTableRaw, 'TaxTableEntry'))
      .concat(arr(byLocal(taxTableRaw, 'TaxCodeDetails')))
      .concat(arr(byLocal(taxTableRaw, 'Tax')));
  const tax_table: TaxTableEntry[] = taxEntries.map((t: any) => ({
    tax_code: byLocal(t, 'TaxCode') || byLocal(t, 'Code') || byLocal(t, 'VATCode'),
    description: byLocal(t, 'Description') || byLocal(t, 'TaxDescription'),
    percentage: byLocal(t, 'TaxPercentage') || byLocal(t, 'TaxPercentageDecimal') || byLocal(t, 'Rate'),
    exemption_reason: byLocal(t, 'TaxExemptionReason') || byLocal(t, 'ExemptionReason'),
    declaration_period: byLocal(t, 'TaxDeclarationPeriod') || byLocal(t, 'DeclarationPeriod'),
    valid_from: byLocal(t, 'ValidFrom') || byLocal(t, 'StartDate'),
    valid_to: byLocal(t, 'ValidTo') || byLocal(t, 'EndDate'),
  }));

  // Analysis types
  const analysisTypesRaw =
    arr(byLocal(master, 'AnalysisTypes'))
      .flatMap((a: any) => arr(byLocal(a, 'AnalysisType')))
      .concat(arr(byLocal(master, 'AnalysisType')));
  const analysis_types: AnalysisTypeInfo[] = analysisTypesRaw.map((a: any) => ({
    analysis_type: byLocal(a, 'AnalysisType') || byLocal(a, 'Type'),
    description: byLocal(a, 'Description'),
  }));

  // Journals and transactions
  const gle = byLocal(root, 'GeneralLedgerEntries');
  const journalsNode = arr(byLocal(gle, 'Journal'));
  const journals: JournalInfo[] = [];
  const transactions: SaftTransaction[] = [];
  const analysis_lines: AnalysisLineInfo[] = [];

  journalsNode.forEach((j: any) => {
    const journal_id = byLocal(j, 'JournalID');
    journals.push({
      journal_id,
      description: byLocal(j, 'Description') || byLocal(j, 'Name'),
      posting_date: byLocal(j, 'PostingDate') || byLocal(j, 'VoucherDate') || byLocal(j, 'EntryDate'),
      journal_type: byLocal(j, 'JournalType') || byLocal(j, 'Type'),
      batch_id: byLocal(j, 'BatchID') || byLocal(j, 'BatchNumber'),
      system_id: byLocal(j, 'SystemID') || byLocal(j, 'System'),
    });

    arr(byLocal(j, 'Transaction')).forEach((t: any) => {
      // Rules A, B, C
      const voucherNo =
        byLocal(t, 'TransactionID') || byLocal(t, 'VoucherNo') || byLocal(t, 'VoucherID') || journal_id;
      const postingDate =
        byLocal(t, 'GLPostingDate') || byLocal(t, 'TransactionDate') || byLocal(t, 'SystemEntryDate');
      const docNoTxn = byLocal(t, 'SourceDocumentID') || byLocal(t, 'ReferenceNumber') || byLocal(t, 'DocumentNo');

      const txnCurrencyCode = byLocal(t, 'CurrencyCode');
      const txnExchangeRate = parseDecimal(byLocal(t, 'ExchangeRate'));

      arr(byLocal(t, 'Line') || byLocal(t, 'TransactionLine') || byLocal(t, 'JournalLine')).forEach((l: any) => {
        const record_id = byLocal(l, 'RecordID') || byLocal(l, 'LineID') || byLocal(l, 'LineNumber');
        const dc = String(byLocal(l, 'DebitCredit') || '').toLowerCase();

        // Amounts: support nested Amount-structure and fallback to Amount + DebitCredit
        let debit = parseAmountNode(byLocal(l, 'DebitAmount'));
        let credit = parseAmountNode(byLocal(l, 'CreditAmount'));
        if (debit === undefined && credit === undefined) {
          const amt = parseAmountNode(byLocal(l, 'Amount'));
          if (amt !== undefined) {
            if (dc.startsWith('d')) debit = Math.abs(amt);
            if (dc.startsWith('c')) credit = Math.abs(amt);
          }
        }

        // Currency info (E)
        const currency = byLocal(l, 'CurrencyCode') || txnCurrencyCode;
        const amount_currency =
          parseAmountNode(byLocal(l, 'CurrencyAmount')) ?? parseAmountNode(byLocal(l, 'AmountCurrency'));
        const exchange_rate = parseDecimal(byLocal(l, 'ExchangeRate')) ?? txnExchangeRate;

        // VAT info (D)
        const taxInfo = byLocal(l, 'TaxInformation');
        let vat_code = byLocal(taxInfo, 'TaxCode') || byLocal(l, 'VatCode') || byLocal(l, 'VATCode') || byLocal(l, 'TaxCode');
        let vat_rate = byLocal(taxInfo, 'TaxPercentageDecimal') || byLocal(taxInfo, 'TaxPercentage') || byLocal(l, 'TaxPercentage');
        const vat_base = parseAmountNode(byLocal(taxInfo, 'TaxBase')) || parseAmountNode(byLocal(l, 'TaxBase'));
        let vat_debit = parseAmountNode(byLocal(taxInfo, 'DebitTaxAmount')) || parseAmountNode(byLocal(l, 'DebitTaxAmount'));
        let vat_credit = parseAmountNode(byLocal(taxInfo, 'CreditTaxAmount')) || parseAmountNode(byLocal(l, 'CreditTaxAmount'));
        if (vat_debit === undefined && vat_credit === undefined) {
          const taxAmt = parseAmountNode(byLocal(taxInfo, 'TaxAmount')) || parseAmountNode(byLocal(l, 'TaxAmount'));
          if (taxAmt !== undefined) {
            if (dc.startsWith('d')) vat_debit = Math.abs(taxAmt);
            if (dc.startsWith('c')) vat_credit = Math.abs(taxAmt);
          }
        }
        const vat_info_source: SaftTransaction['vat_info_source'] = taxInfo ? 'line' : vat_code ? 'fallback' : undefined;

        const document_no =
          byLocal(l, 'SourceDocumentID') || byLocal(l, 'ReferenceNumber') || byLocal(l, 'DocumentNo') || docNoTxn;

        const trx: SaftTransaction = {
          journal_id,
          record_id,
          voucher_no: String(voucherNo || ''),
          posting_date: postingDate,
          account_id: byLocal(l, 'AccountID'),
          description: byLocal(l, 'Description') || byLocal(l, 'Text') || byLocal(l, 'Name'),
          customer_id: byLocal(l, 'CustomerID') || byLocal(t, 'CustomerID'),
          supplier_id: byLocal(l, 'SupplierID') || byLocal(t, 'SupplierID'),
          document_no,
          reference_no: byLocal(l, 'ReferenceNumber') || byLocal(t, 'ReferenceNumber'),
          value_date: byLocal(l, 'ValueDate') || byLocal(t, 'ValueDate'),
          due_date: byLocal(l, 'DueDate') || byLocal(t, 'DueDate'),
          cid: byLocal(l, 'KID') || byLocal(l, 'CID') || byLocal(t, 'KID') || byLocal(t, 'CID'),
          currency,
          amount_currency,
          exchange_rate,
          debit,
          credit,
          vat_code: vat_code,
          vat_rate,
          vat_base,
          vat_debit,
          vat_credit,
          vat_info_source,
        };
        transactions.push(trx);

        // Analysis lines per transaction line
        const analyses = arr(byLocal(l, 'Analysis'));
        analyses.forEach((a: any) => {
          const adc = String(byLocal(a, 'DebitCredit') || '').toLowerCase();
          let aDebit = parseAmountNode(byLocal(a, 'DebitAnalysisAmount')) ?? parseAmountNode(byLocal(a, 'DebitAmount'));
          let aCredit = parseAmountNode(byLocal(a, 'CreditAnalysisAmount')) ?? parseAmountNode(byLocal(a, 'CreditAmount'));
          if (aDebit === undefined && aCredit === undefined) {
            const aAmt = parseAmountNode(byLocal(a, 'AnalysisAmount')) ?? parseAmountNode(byLocal(a, 'Amount'));
            if (aAmt !== undefined) {
              if (adc.startsWith('d')) aDebit = Math.abs(aAmt);
              if (adc.startsWith('c')) aCredit = Math.abs(aAmt);
            }
          }
          analysis_lines.push({
            journal_id,
            record_id,
            analysis_type: byLocal(a, 'AnalysisType') || byLocal(a, 'Type'),
            analysis_id: byLocal(a, 'AnalysisID') || byLocal(a, 'ID'),
            debit_amt: aDebit,
            credit_amt: aCredit,
          });
        });
      });
    });
  });

  return {
    header,
    company,
    bank_accounts,
    accounts,
    customers,
    suppliers,
    tax_table,
    analysis_types,
    journals,
    transactions,
    analysis_lines,
  };
}
