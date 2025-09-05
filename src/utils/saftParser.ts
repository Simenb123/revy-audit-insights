import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';

export interface SaftAccount {
  account_id: string;
  description?: string;
  account_type?: string;
  type?: string;
  // SAF-T 1.3 required fields
  grouping_category?: string;
  grouping_code?: string;
  standard_account_code?: string;
  // Extended balance fields
  opening_debit_balance?: number;
  opening_credit_balance?: number;
  closing_debit_balance?: number;
  closing_credit_balance?: number;
  opening_balance?: number;
  closing_balance?: number;
  opening_balance_netto?: number;
  closing_balance_netto?: number;
  vat_code?: string;
}

export interface SaftTransaction {
  journal_id?: string;
  record_id?: string;
  voucher_no?: string;
  transaction_id?: string;
  account_id?: string;
  description?: string;
  customer_id?: string;
  supplier_id?: string;
  document_no?: string;
  reference_no?: string;
  value_date?: string;
  due_date?: string;
  cid?: string;
  cross_reference?: string;
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
  // Extended date fields - SAF-T 1.3
  transaction_date?: string;
  system_entry_date?: string;
  system_entry_time?: string;
  modification_date?: string;
  // Extended voucher fields - SAF-T 1.3
  voucher_type?: string;
  voucher_description?: string;
  source_id?: string;
  source_system?: string;
  vat_info_source?: 'line' | 'fallback' | undefined;
}

export interface HeaderInfo {
  file_version?: string;
  software?: string;
  software_ver?: string;
  created?: string;
  start?: string;
  end?: string;
  default_currency?: string;
  // SAF-T 1.3 extended header fields
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  software_company?: string;
  product_id?: string;
  company_id?: string;
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
  // SAF-T 1.3 extended address fields
  region?: string;
  county?: string;
  building_number?: string;
  additional_address_detail?: string;
}

export interface BankAccountInfo {
  bank_account_number?: string;
  iban?: string; 
  bank_account_name?: string;
  bic?: string;
  sort_code?: string;
  currency_code?: string;
  gl_account_id?: string;
  // Legacy fields for compatibility
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
  type?: string;
  status?: string;
  balance_account?: string;
  // BalanceAccountStructure fields
  balance_account_id?: string;
  opening_debit_balance?: number;
  opening_credit_balance?: number;
  closing_debit_balance?: number;
  closing_credit_balance?: number;
  opening_balance_netto?: number;
  closing_balance_netto?: number;
  // Payment terms for due date calculation
  payment_terms_days?: number;
  payment_terms_months?: number;
}

export interface SupplierInfo {
  id?: string;
  name?: string;
  vat?: string;
  country?: string;
  city?: string;
  postal?: string;
  street?: string;
  type?: string;
  status?: string;
  balance_account?: string;
  // BalanceAccountStructure fields
  balance_account_id?: string;
  opening_debit_balance?: number;
  opening_credit_balance?: number;
  closing_debit_balance?: number;
  closing_credit_balance?: number;
  opening_balance_netto?: number;
  closing_balance_netto?: number;
  // Payment terms for due date calculation
  payment_terms_days?: number;
  payment_terms_months?: number;
}

export interface TaxTableEntry {
  tax_code?: string;
  description?: string;
  tax_percentage?: number | string;
  percentage?: number | string; // Legacy field
  standard_tax_code?: string;
  exemption_reason?: string;
  declaration_period?: string;
  valid_from?: string;
  valid_to?: string;
  base_rate?: number;
  country?: string;
}

export interface AnalysisTypeInfo {
  analysis_type?: string;
  analysis_type_description?: string;
  analysis_id?: string;
  analysis_id_description?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  // Legacy field
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
  period_start?: string;
  period_end?: string;
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
  
  // Extract contact information from header
  const contactNode = byLocal(headerNode, 'Contact') || byLocal(headerNode, 'ContactPerson');

  const header: HeaderInfo | null = headerNode
    ? {
        file_version:
          byLocal(headerNode, 'AuditFileVersion') ||
          byLocal(headerNode, 'FileVersion') ||
          byLocal(headerNode, 'Version'),
        software: softwareCombined || byLocal(headerNode, 'Software') || undefined,
        software_ver: byLocal(headerNode, 'SoftwareVersion') || byLocal(headerNode, 'ProductVersion'),
        created: byLocal(headerNode, 'DateCreated') || byLocal(headerNode, 'CreatedDate') || byLocal(headerNode, 'FileCreatedDate') || byLocal(headerNode, 'CreationDate'),
        start: byLocal(headerNode, 'StartDate') || byLocal(headerNode, 'PeriodStart') || byLocal(headerNode, 'SelectionStartDate') || byLocal(headerNode, 'FromDate'),
        end: byLocal(headerNode, 'EndDate') || byLocal(headerNode, 'PeriodEnd') || byLocal(headerNode, 'SelectionEndDate') || byLocal(headerNode, 'ToDate'),
        default_currency: byLocal(headerNode, 'DefaultCurrencyCode') || byLocal(headerNode, 'CurrencyCode'),
        // SAF-T 1.3 extended header fields
        contact_person: byLocal(contactNode, 'ContactPerson') || byLocal(contactNode, 'Name'),
        contact_email: byLocal(contactNode, 'Email') || byLocal(contactNode, 'EmailAddress'),
        contact_phone: byLocal(contactNode, 'Phone') || byLocal(contactNode, 'Telephone'),
        software_company: softwareCompany,
        product_id: byLocal(headerNode, 'ProductID') || byLocal(headerNode, 'SoftwareProductID'),
        company_id: byLocal(headerNode, 'CompanyID') || byLocal(headerNode, 'EntityID'),
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
        // SAF-T 1.3 extended address fields
        region: byLocal(compAddr, 'Region') || byLocal(compAddr, 'State'),
        county: byLocal(compAddr, 'County') || byLocal(compAddr, 'Province'),
        building_number: byLocal(compAddr, 'BuildingNumber') || byLocal(compAddr, 'HouseNumber'),
        additional_address_detail: byLocal(compAddr, 'AdditionalAddressDetail') || byLocal(compAddr, 'AddressLine2'),
      }
    : null;

  // MasterFiles
  const master = byLocal(root, 'MasterFiles');

  // Bank accounts
  const bankAccountsRaw =
    byLocal(master, 'BankAccounts') || byLocal(master, 'BankAccount') || byLocal(master, 'Banks');
  const bank_accounts: BankAccountInfo[] = arr(byLocal(bankAccountsRaw, 'BankAccount') || bankAccountsRaw).map(
    (b: any) => ({
      // Extended fields
      bank_account_number: byLocal(b, 'BankAccountNumber') || byLocal(b, 'AccountNumber'),
      iban: byLocal(b, 'IBAN'),
      bank_account_name: byLocal(b, 'BankAccountName') || byLocal(b, 'AccountName') || byLocal(b, 'Name') || byLocal(b, 'Description'),
      bic: byLocal(b, 'BIC') || byLocal(b, 'BankIdentifierCode') || byLocal(b, 'SwiftCode'),
      sort_code: byLocal(b, 'SortCode') || byLocal(b, 'BankCode'),
      currency_code: byLocal(b, 'CurrencyCode') || byLocal(b, 'Currency'),
      gl_account_id: byLocal(b, 'GLAccountID') || byLocal(b, 'GeneralLedgerAccountID') || byLocal(b, 'AccountGLID'),
      // Legacy fields for compatibility
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

    // Calculate netto balances
    const opening_balance_netto = (openingDebit !== undefined && openingCredit !== undefined)
      ? (openingDebit || 0) - (openingCredit || 0)
      : opening_balance;

    const closing_balance_netto = (closingDebit !== undefined && closingCredit !== undefined)
      ? (closingDebit || 0) - (closingCredit || 0)
      : closing_balance;

    return {
      account_id: byLocal(a, 'AccountID') || byLocal(a, 'AccountNumber') || byLocal(a, 'Number'),
      description: byLocal(a, 'AccountDescription') || byLocal(a, 'Description') || byLocal(a, 'Name'),
      account_type: byLocal(a, 'AccountType') || byLocal(a, 'Type'),
      type: byLocal(a, 'AccountType') || byLocal(a, 'Type'), // Legacy field
      // SAF-T 1.3 required fields
      grouping_category: byLocal(a, 'GroupingCategory'),
      grouping_code: byLocal(a, 'GroupingCode') || byLocal(a, 'StandardAccountCode'),
      standard_account_code: byLocal(a, 'GroupingCode') || byLocal(a, 'StandardAccountCode'),
      // Extended balance fields
      opening_debit_balance: openingDebit,
      opening_credit_balance: openingCredit,
      closing_debit_balance: closingDebit,
      closing_credit_balance: closingCredit,
      opening_balance,
      closing_balance,
      opening_balance_netto,
      closing_balance_netto,
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
    const balStruct = byLocal(c, 'BalanceAccountStructure');
    const paymentTerms = byLocal(c, 'PaymentTerms');
    
    // Parse BalanceAccountStructure amounts
    const openingDebit = parseAmountNode(byLocal(balStruct, 'OpeningDebitBalance'));
    const openingCredit = parseAmountNode(byLocal(balStruct, 'OpeningCreditBalance'));
    const closingDebit = parseAmountNode(byLocal(balStruct, 'ClosingDebitBalance'));
    const closingCredit = parseAmountNode(byLocal(balStruct, 'ClosingCreditBalance'));
    
    // Parse PaymentTerms
    const paymentTermsDays = parseDecimal(byLocal(paymentTerms, 'Days') || byLocal(paymentTerms, 'PaymentTermsDays'));
    const paymentTermsMonths = parseDecimal(byLocal(paymentTerms, 'Months') || byLocal(paymentTerms, 'PaymentTermsMonths'));
    
    return {
      id: byLocal(c, 'CustomerID') || byLocal(c, 'ID'),
      name: byLocal(c, 'CustomerName') || byLocal(c, 'Name'),
      vat: byLocal(c, 'TaxRegistrationNumber') || byLocal(c, 'VATNumber') || byLocal(c, 'TaxID') || byLocal(c, 'OrganizationNumber') || byLocal(c, 'RegistrationNumber'),
      country: byLocal(addr, 'Country') || byLocal(addr, 'CountryCode'),
      city: byLocal(addr, 'City') || byLocal(addr, 'Town'),
      postal: byLocal(addr, 'PostalCode') || byLocal(addr, 'PostCode'),
      street: byLocal(addr, 'StreetName') || byLocal(addr, 'AddressLine1') || byLocal(addr, 'AddressDetail'),
      type: byLocal(c, 'CustomerType') || byLocal(c, 'Type'),
      status: byLocal(c, 'Status') || byLocal(c, 'CustomerStatus'),
      balance_account:
        byLocal(balStruct, 'BalanceAccount') ||
        byLocal(c, 'BalanceAccount') || byLocal(c, 'ReceivableAccount') || byLocal(c, 'GeneralLedgerAccountID'),
      // BalanceAccountStructure fields
      balance_account_id: byLocal(balStruct, 'BalanceAccountID') || byLocal(balStruct, 'BalanceAccount'),
      opening_debit_balance: openingDebit,
      opening_credit_balance: openingCredit,
      closing_debit_balance: closingDebit,
      closing_credit_balance: closingCredit,
      opening_balance_netto: (openingDebit !== undefined && openingCredit !== undefined) ? (openingDebit || 0) - (openingCredit || 0) : undefined,
      closing_balance_netto: (closingDebit !== undefined && closingCredit !== undefined) ? (closingDebit || 0) - (closingCredit || 0) : undefined,
      // Payment terms for due date calculation
      payment_terms_days: paymentTermsDays,
      payment_terms_months: paymentTermsMonths,
    };
  });

  // Suppliers
  const suppliersRaw =
    arr(byLocal(master, 'Suppliers'))
      .flatMap((s: any) => arr(byLocal(s, 'Supplier')))
      .concat(arr(byLocal(master, 'Supplier')));
  const suppliers: SupplierInfo[] = suppliersRaw.map((s: any) => {
    const addr = byLocal(s, 'Address') || byLocal(s, 'BillingAddress');
    const balStruct = byLocal(s, 'BalanceAccountStructure');
    const paymentTerms = byLocal(s, 'PaymentTerms');
    
    // Parse BalanceAccountStructure amounts
    const openingDebit = parseAmountNode(byLocal(balStruct, 'OpeningDebitBalance'));
    const openingCredit = parseAmountNode(byLocal(balStruct, 'OpeningCreditBalance'));
    const closingDebit = parseAmountNode(byLocal(balStruct, 'ClosingDebitBalance'));
    const closingCredit = parseAmountNode(byLocal(balStruct, 'ClosingCreditBalance'));
    
    // Parse PaymentTerms
    const paymentTermsDays = parseDecimal(byLocal(paymentTerms, 'Days') || byLocal(paymentTerms, 'PaymentTermsDays'));
    const paymentTermsMonths = parseDecimal(byLocal(paymentTerms, 'Months') || byLocal(paymentTerms, 'PaymentTermsMonths'));
    
    return {
      id: byLocal(s, 'SupplierID') || byLocal(s, 'ID'),
      name: byLocal(s, 'SupplierName') || byLocal(s, 'Name'),
      vat: byLocal(s, 'TaxRegistrationNumber') || byLocal(s, 'VATNumber') || byLocal(s, 'TaxID') || byLocal(s, 'OrganizationNumber') || byLocal(s, 'RegistrationNumber'),
      country: byLocal(addr, 'Country') || byLocal(addr, 'CountryCode'),
      city: byLocal(addr, 'City') || byLocal(addr, 'Town'),
      postal: byLocal(addr, 'PostalCode') || byLocal(addr, 'PostCode'),
      street: byLocal(addr, 'StreetName') || byLocal(addr, 'AddressLine1') || byLocal(addr, 'AddressDetail'),
      type: byLocal(s, 'SupplierType') || byLocal(s, 'Type'),
      status: byLocal(s, 'Status') || byLocal(s, 'SupplierStatus'),
      balance_account:
        byLocal(balStruct, 'BalanceAccount') ||
        byLocal(s, 'BalanceAccount') || byLocal(s, 'PayableAccount') || byLocal(s, 'GeneralLedgerAccountID'),
      // BalanceAccountStructure fields
      balance_account_id: byLocal(balStruct, 'BalanceAccountID') || byLocal(balStruct, 'BalanceAccount'),
      opening_debit_balance: openingDebit,
      opening_credit_balance: openingCredit,
      closing_debit_balance: closingDebit,
      closing_credit_balance: closingCredit,
      opening_balance_netto: (openingDebit !== undefined && openingCredit !== undefined) ? (openingDebit || 0) - (openingCredit || 0) : undefined,
      closing_balance_netto: (closingDebit !== undefined && closingCredit !== undefined) ? (closingDebit || 0) - (closingCredit || 0) : undefined,
      // Payment terms for due date calculation
      payment_terms_days: paymentTermsDays,
      payment_terms_months: paymentTermsMonths,
    };
  });

  // Tax table
  const taxTableRaw = byLocal(master, 'TaxTable') || byLocal(master, 'Taxes');
  const taxEntries =
    arr(byLocal(taxTableRaw, 'TaxTableEntry'))
      .concat(arr(byLocal(taxTableRaw, 'TaxCodeDetails')))
      .concat(arr(byLocal(taxTableRaw, 'Tax')));
  const tax_table: TaxTableEntry[] = taxEntries.map((t: any) => ({
    tax_code: byLocal(t, 'TaxCode') || byLocal(t, 'Code') || byLocal(t, 'VATCode') || byLocal(t, 'TaxCodeID'),
    description: byLocal(t, 'Description') || byLocal(t, 'TaxDescription') || byLocal(t, 'TaxCodeDescription'),
    tax_percentage: byLocal(t, 'TaxPercentage') || byLocal(t, 'TaxPercentageDecimal') || byLocal(t, 'Rate') || byLocal(t, 'TaxRate'),
    percentage: byLocal(t, 'TaxPercentage') || byLocal(t, 'TaxPercentageDecimal') || byLocal(t, 'Rate') || byLocal(t, 'TaxRate'), // Legacy field
    standard_tax_code: byLocal(t, 'StandardTaxCode') || byLocal(t, 'BaseCode'),
    exemption_reason: byLocal(t, 'TaxExemptionReason') || byLocal(t, 'ExemptionReason') || byLocal(t, 'Exemption'),
    declaration_period: byLocal(t, 'TaxDeclarationPeriod') || byLocal(t, 'DeclarationPeriod') || byLocal(t, 'ReportingPeriod'),
    valid_from: byLocal(t, 'ValidFrom') || byLocal(t, 'StartDate') || byLocal(t, 'EffectiveFrom'),
    valid_to: byLocal(t, 'ValidTo') || byLocal(t, 'EndDate') || byLocal(t, 'EffectiveTo'),
    base_rate: parseDecimal(byLocal(t, 'BaseRate') || byLocal(t, 'BaseTaxRate')),
    country: byLocal(t, 'Country') || byLocal(t, 'CountryCode'),
  }));

  // Analysis types
  const analysisTypesRaw =
    arr(byLocal(master, 'AnalysisTypes'))
      .flatMap((a: any) => arr(byLocal(a, 'AnalysisType')))
      .concat(arr(byLocal(master, 'AnalysisType')));
  const analysis_types: AnalysisTypeInfo[] = analysisTypesRaw.map((a: any) => ({
    analysis_type: byLocal(a, 'AnalysisType') || byLocal(a, 'Type'),
    analysis_type_description: byLocal(a, 'AnalysisTypeDescription') || byLocal(a, 'TypeDescription'),
    analysis_id: byLocal(a, 'AnalysisID') || byLocal(a, 'ID'),
    analysis_id_description: byLocal(a, 'AnalysisIDDescription') || byLocal(a, 'IDDescription'),
    start_date: byLocal(a, 'StartDate') || byLocal(a, 'ValidFrom'),
    end_date: byLocal(a, 'EndDate') || byLocal(a, 'ValidTo'),
    status: byLocal(a, 'Status') || byLocal(a, 'Active'),
    description: byLocal(a, 'Description'), // Legacy field
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
      // Enhanced rules A, B, C
      const transactionId = byLocal(t, 'TransactionID');
      const voucherNo = transactionId || byLocal(t, 'VoucherNo') || byLocal(t, 'VoucherID') || journal_id;
      const postingDate =
        byLocal(t, 'GLPostingDate') || byLocal(t, 'TransactionDate') || byLocal(t, 'SystemEntryDate');
      const docNoTxn = byLocal(t, 'SourceDocumentID') || byLocal(t, 'ReferenceNumber') || byLocal(t, 'DocumentNo');

      // Extended transaction-level fields
      const transactionDate = byLocal(t, 'TransactionDate');
      const systemEntryDate = byLocal(t, 'SystemEntryDate');
      const systemEntryTime = byLocal(t, 'SystemEntryTime');
      const voucherType = byLocal(t, 'VoucherType') || byLocal(t, 'TransactionType');
      const voucherDescription = byLocal(t, 'VoucherDescription') || byLocal(t, 'Description');
      const sourceId = byLocal(t, 'SourceID') || byLocal(t, 'SystemID');

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
          transaction_id: transactionId,
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
          cross_reference: byLocal(l, 'CrossReference') || byLocal(t, 'CrossReference'),
          currency,
          amount_currency,
          exchange_rate,
          debit,
          credit,
          // Extended date fields - SAF-T 1.3
          transaction_date: transactionDate,
          system_entry_date: systemEntryDate,
          system_entry_time: systemEntryTime,
          modification_date: byLocal(l, 'ModificationDate') || byLocal(t, 'ModificationDate'),
          // Extended voucher fields - SAF-T 1.3
          voucher_type: voucherType,
          voucher_description: voucherDescription,
          source_id: sourceId,
          source_system: byLocal(l, 'SourceSystem') || byLocal(t, 'SourceSystem'),
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
          // Enhanced parsing for analysis amounts with more field alternatives
          let aDebit = parseAmountNode(byLocal(a, 'DebitAnalysisAmount')) ?? 
                      parseAmountNode(byLocal(a, 'DebitAmount')) ??
                      parseAmountNode(byLocal(a, 'Debit/Amount')) ??
                      parseAmountNode(byLocal(a, 'DebitAnalysisAmount/Amount'));
          let aCredit = parseAmountNode(byLocal(a, 'CreditAnalysisAmount')) ?? 
                       parseAmountNode(byLocal(a, 'CreditAmount')) ??
                       parseAmountNode(byLocal(a, 'Credit/Amount')) ??
                       parseAmountNode(byLocal(a, 'CreditAnalysisAmount/Amount'));
          
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
