import { UploadTypeConfig } from '@/types/upload';

export const UPLOAD_CONFIGS: Record<string, UploadTypeConfig> = {
  'trial-balance': {
    id: 'trial-balance',
    name: 'Saldobalanse',
    description: 'Last opp saldobalanse fra regnskapssystem',
    icon: 'Balance',
    acceptedFileTypes: {
      '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      '.xls': ['application/vnd.ms-excel'],
      '.csv': ['text/csv']
    },
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 1,
    enableAISuggestions: true,
    enablePreview: true,
    processingSteps: [
      { id: 'upload', title: 'Last opp fil' },
      { id: 'parse', title: 'Les filinnhold' },
      { id: 'map', title: 'Koble kolonner' },
      { id: 'validate', title: 'Valider data' },
      { id: 'save', title: 'Lagre til database' }
    ],
    fieldDefinitions: [
      {
        field_key: 'account_number',
        field_label: 'Kontonummer',
        is_required: true,
        data_type: 'text',
        sort_order: 1,
        category: 'Konto',
        example_values: ['1500', '2400', '3000']
      },
      {
        field_key: 'account_name',
        field_label: 'Kontonavn',
        is_required: true,
        data_type: 'text',
        sort_order: 2,
        category: 'Konto',
        example_values: ['Driftsmidler', 'Leverandørgjeld', 'Salgsinntekt']
      },
      {
        field_key: 'opening_balance',
        field_label: 'Inngående saldo',
        is_required: false,
        data_type: 'number',
        sort_order: 3,
        category: 'Beløp',
        example_values: ['100000', '-50000', '0']
      },
      {
        field_key: 'closing_balance',
        field_label: 'Utgående saldo',
        is_required: true,
        data_type: 'number',
        sort_order: 4,
        category: 'Beløp',
        example_values: ['120000', '-45000', '0']
      }
    ]
  },

  'general-ledger': {
    id: 'general-ledger',
    name: 'Hovedbok',
    description: 'Last opp hovedbok med transaksjoner',
    icon: 'Book',
    acceptedFileTypes: {
      '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      '.xls': ['application/vnd.ms-excel'],
      '.csv': ['text/csv']
    },
    maxFileSize: 25 * 1024 * 1024, // 25MB
    maxFiles: 1,
    enableAISuggestions: true,
    enablePreview: true,
    processingSteps: [
      { id: 'upload', title: 'Last opp fil' },
      { id: 'parse', title: 'Les filinnhold' },
      { id: 'map', title: 'Koble kolonner' },
      { id: 'validate', title: 'Valider transaksjoner' },
      { id: 'save', title: 'Lagre til database' }
    ],
    fieldDefinitions: [
      {
        field_key: 'date',
        field_label: 'Dato',
        is_required: true,
        data_type: 'date',
        sort_order: 1,
        category: 'Transaksjon',
        example_values: ['01.01.2024', '2024-01-01']
      },
      {
        field_key: 'account_number',
        field_label: 'Kontonummer',
        is_required: true,
        data_type: 'text',
        sort_order: 2,
        category: 'Konto',
        example_values: ['1500', '2400', '3000']
      },
      {
        field_key: 'description',
        field_label: 'Beskrivelse',
        is_required: true,
        data_type: 'text',
        sort_order: 3,
        category: 'Transaksjon',
        example_values: ['Innkjøp kontormateriale', 'Lønn ansatte', 'Salg produkter']
      },
      {
        field_key: 'debit_amount',
        field_label: 'Debet beløp',
        is_required: false,
        data_type: 'number',
        sort_order: 4,
        category: 'Beløp',
        example_values: ['5000', '125000', '0']
      },
      {
        field_key: 'credit_amount',
        field_label: 'Kredit beløp',
        is_required: false,
        data_type: 'number',
        sort_order: 5,
        category: 'Beløp',
        example_values: ['5000', '125000', '0']
      },
      {
        field_key: 'voucher_number',
        field_label: 'Bilagsnummer',
        is_required: false,
        data_type: 'text',
        sort_order: 6,
        category: 'Transaksjon',
        example_values: ['B001', '2024-001', 'INV-123']
      }
    ]
  },

  'client-bulk': {
    id: 'client-bulk',
    name: 'Klientimport',
    description: 'Last opp flere klienter samtidig',
    icon: 'Users',
    acceptedFileTypes: {
      '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      '.xls': ['application/vnd.ms-excel'],
      '.csv': ['text/csv']
    },
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 1,
    enableAISuggestions: true,
    enablePreview: true,
    processingSteps: [
      { id: 'upload', title: 'Last opp fil' },
      { id: 'parse', title: 'Les filinnhold' },
      { id: 'map', title: 'Koble kolonner' },
      { id: 'validate', title: 'Valider klientdata' },
      { id: 'save', title: 'Opprett klienter' }
    ],
    fieldDefinitions: [
      {
        field_key: 'company_name',
        field_label: 'Firmanavn',
        is_required: true,
        data_type: 'text',
        sort_order: 1,
        category: 'Grunninfo',
        example_values: ['Eksempel AS', 'Test Bedrift AS', 'Ny Kunde AS']
      },
      {
        field_key: 'org_number',
        field_label: 'Organisasjonsnummer',
        is_required: true,
        data_type: 'text',
        validation_rules: { pattern: '^\\d{9}$' },
        sort_order: 2,
        category: 'Grunninfo',
        example_values: ['123456789', '987654321']
      },
      {
        field_key: 'contact_email',
        field_label: 'Kontakt e-post',
        is_required: false,
        data_type: 'email',
        sort_order: 3,
        category: 'Kontakt',
        example_values: ['post@eksempel.no', 'kontakt@test.no']
      },
      {
        field_key: 'contact_phone',
        field_label: 'Telefon',
        is_required: false,
        data_type: 'text',
        sort_order: 4,
        category: 'Kontakt',
        example_values: ['+47 12345678', '12345678']
      },
      {
        field_key: 'address',
        field_label: 'Adresse',
        is_required: false,
        data_type: 'text',
        sort_order: 5,
        category: 'Kontakt',
        example_values: ['Storgata 1, 0001 Oslo', 'Industriveien 5, 1234 Sted']
      }
    ]
  },

  'legal-documents': {
    id: 'legal-documents',
    name: 'Juridiske bestemmelser', 
    description: 'Last opp juridiske bestemmelser og lovverk fra Excel/CSV',
    icon: 'Scale',
    acceptedFileTypes: {
      '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      '.xls': ['application/vnd.ms-excel'],
      '.csv': ['text/csv']
    },
    maxFileSize: 50 * 1024 * 1024, // 50MB
    maxFiles: 5,
    enableAISuggestions: true,
    enablePreview: true,
    processingSteps: [
      { id: 'upload', title: 'Last opp fil', description: 'Velg Excel eller CSV fil med juridiske bestemmelser' },
      { id: 'mapping', title: 'Kolonnemapping', description: 'Map filkolonner til juridiske feltdefinisjoner' },
      { id: 'validation', title: 'Validering', description: 'Valider dataformat og obligatoriske felt' },
      { id: 'import', title: 'Import', description: 'Importer validerte juridiske bestemmelser' }
    ],
    fieldDefinitions: [
      {
        field_key: 'provision_id',
        field_label: 'Bestemmelse ID',
        field_description: 'Unik identifikator for bestemmelsen',
        is_required: true,
        data_type: 'text',
        sort_order: 1,
        category: 'Identifikasjon',
        example_values: ['LOV-001', 'REG-123', 'BEST-456']
      },
      {
        field_key: 'law_identifier',
        field_label: 'Lov ID/Kode',
        field_description: 'Identifikator for loven bestemmelsen tilhører',
        is_required: true,
        data_type: 'text',
        sort_order: 2,
        category: 'Identifikasjon',
        example_values: ['LOV-2005-05-20-28', 'FOR-2017-06-21-915']
      },
      {
        field_key: 'provision_type',
        field_label: 'Bestemmelsestype',
        field_description: 'Type bestemmelse (paragraf, ledd, etc.)',
        is_required: true,
        data_type: 'text',
        sort_order: 3,
        category: 'Klassifikasjon',
        example_values: ['paragraf', 'ledd', 'punkt']
      },
      {
        field_key: 'provision_number',
        field_label: 'Paragrafnummer',
        field_description: 'Nummer på bestemmelsen',
        is_required: true,
        data_type: 'text',
        sort_order: 4,
        category: 'Identifikasjon',
        example_values: ['1', '2-1', '15a']
      },
      {
        field_key: 'title',
        field_label: 'Tittel',
        field_description: 'Overskrift eller tittel på bestemmelsen',
        is_required: true,
        data_type: 'text',
        sort_order: 5,
        category: 'Innhold',
        example_values: ['Formål', 'Definisjoner', 'Anvendelsesområde']
      },
      {
        field_key: 'content',
        field_label: 'Innhold/Tekst',
        field_description: 'Hovedteksten i bestemmelsen',
        is_required: true,
        data_type: 'text',
        sort_order: 6,
        category: 'Innhold',
        example_values: ['Lovens formål er å...', 'I denne loven forstås med...']
      },
      {
        field_key: 'parent_provision_id',
        field_label: 'Overordnet bestemmelse',
        field_description: 'ID til overordnet bestemmelse (valgfri)',
        is_required: false,
        data_type: 'text',
        sort_order: 7,
        category: 'Struktur',
        example_values: ['CAP-001', 'SEC-123']
      },
      {
        field_key: 'valid_from',
        field_label: 'Gyldig fra',
        field_description: 'Dato bestemmelsen trer i kraft',
        is_required: false,
        data_type: 'date',
        sort_order: 8,
        category: 'Gyldighet',
        example_values: ['2023-01-01', '2024-07-01']
      },
      {
        field_key: 'valid_until',
        field_label: 'Gyldig til',
        field_description: 'Dato bestemmelsen opphører',
        is_required: false,
        data_type: 'date',
        sort_order: 9,
        category: 'Gyldighet',
        example_values: ['2025-12-31', '2030-06-30']
      }
    ]
  },

  'pdf-creator': {
    id: 'pdf-creator',
    name: 'PDF Creator',
    description: 'Generer PDF-bilag fra regnskapsdata',
    icon: 'FileText',
    acceptedFileTypes: {
      '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      '.xls': ['application/vnd.ms-excel'],
      '.csv': ['text/csv']
    },
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 1,
    enableAISuggestions: true,
    enablePreview: true,
    processingSteps: [
      { id: 'upload', title: 'Last opp fil' },
      { id: 'parse', title: 'Les filinnhold' },
      { id: 'map', title: 'Koble kolonner' },
      { id: 'validate', title: 'Valider data' },
      { id: 'generate', title: 'Generer PDF-bilag' }
    ],
    fieldDefinitions: [
      {
        field_key: 'bilag',
        field_label: 'Bilag/Voucher',
        field_description: 'Bilagsnummer eller voucher nummer',
        is_required: true,
        data_type: 'text',
        sort_order: 1,
        category: 'Identifikasjon',
        example_values: ['1001', 'VB001', 'FB2024001'],
        aliases: ['bilag', 'voucher', 'bilagsnummer', 'bilagsnr', 'voucher_number', 'dok_nr', 'dokument']
      },
      {
        field_key: 'fakturanummer',
        field_label: 'Fakturanummer',
        field_description: 'Fakturanummer eller dokumentnummer',
        is_required: false,
        data_type: 'text',
        sort_order: 2,
        category: 'Identifikasjon',
        example_values: ['INV-2024-001', '12345'],
        aliases: ['fakturanummer', 'fakturanr', 'invoice', 'invoice_number', 'faktura', 'inv_nr']
      },
      {
        field_key: 'fakturadato',
        field_label: 'Fakturadato/Dato',
        field_description: 'Transaksjonsdato eller fakturadato',
        is_required: true,
        data_type: 'date',
        sort_order: 3,
        category: 'Dato',
        example_values: ['01.01.2024', '2024-01-01'],
        aliases: ['dato', 'date', 'fakturadato', 'bilagsdato', 'transaksjonsdato', 'regnskapsdato', 'invoice_date']
      },
      {
        field_key: 'konto',
        field_label: 'Kontonummer',
        field_description: 'Regnskapskonto',
        is_required: true,
        data_type: 'number',
        sort_order: 4,
        category: 'Regnskap',
        example_values: ['1500', '2400', '3000'],
        aliases: ['konto', 'kontonummer', 'kontonr', 'account', 'account_number', 'acc_no', 'kontokode']
      },
      {
        field_key: 'beskrivelse',
        field_label: 'Beskrivelse',
        field_description: 'Tekst eller beskrivelse av transaksjon',
        is_required: false,
        data_type: 'text',
        sort_order: 5,
        category: 'Beskrivelse',
        example_values: ['Salg av tjenester', 'Innkjøp av varer'],
        aliases: ['beskrivelse', 'tekst', 'text', 'description', 'bilagstekst', 'forklaring', 'kommentar']
      },
      {
        field_key: 'debet',
        field_label: 'Debet',
        field_description: 'Debetbeløp',
        is_required: false,
        data_type: 'number',
        sort_order: 6,
        category: 'Beløp',
        aliases: ['debet', 'debit', 'skal', 'dr', 'debet_amount', 'soll']
      },
      {
        field_key: 'kredit',
        field_label: 'Kredit',
        field_description: 'Kreditbeløp',
        is_required: false,
        data_type: 'number',
        sort_order: 7,
        category: 'Beløp',
        aliases: ['kredit', 'credit', 'have', 'haver', 'cr', 'credit_amount']
      },
      {
        field_key: 'netto',
        field_label: 'Netto beløp',
        field_description: 'Nettobeløp uten mva',
        is_required: false,
        data_type: 'number',
        sort_order: 8,
        category: 'Beløp',
        aliases: ['netto', 'netto_beløp', 'nettobeløp', 'net', 'net_amount', 'beløp_netto']
      },
      {
        field_key: 'mva_sats',
        field_label: 'MVA-sats',
        field_description: 'MVA-prosent (25, 15, 0)',
        is_required: false,
        data_type: 'number',
        sort_order: 9,
        category: 'MVA',
        aliases: ['mva_sats', 'mvasats', 'mva', 'mvakode', 'vat_rate', 'tax_rate', 'skattesats']
      },
      {
        field_key: 'mva_belop',
        field_label: 'MVA-beløp',
        field_description: 'MVA-beløp i kroner',
        is_required: false,
        data_type: 'number',
        sort_order: 10,
        category: 'MVA',
        aliases: ['mva_beløp', 'mvabeløp', 'mva_belop', 'vat_amount', 'tax_amount', 'skattebeløp']
      },
      {
        field_key: 'motpart',
        field_label: 'Kunde/Leverandør navn',
        field_description: 'Navn på motpart (kunde eller leverandør)',
        is_required: false,
        data_type: 'text',
        sort_order: 11,
        category: 'Motpart',
        example_values: ['Acme AS', 'John Doe'],
        aliases: ['motpart', 'leverandør', 'leverandørnavn', 'kunde', 'kundenavn', 'supplier', 'customer', 'vendor', 'company']
      },
      {
        field_key: 'motpart_adresse',
        field_label: 'Motpart adresse',
        field_description: 'Adresse til kunde eller leverandør',
        is_required: false,
        data_type: 'text',
        sort_order: 12,
        category: 'Motpart',
        aliases: ['motpart_adresse', 'leverandøradresse', 'kundeadresse', 'adresse', 'address', 'supplier_address', 'vendor_address']
      },
      {
        field_key: 'antall',
        field_label: 'Antall',
        field_description: 'Antall enheter',
        is_required: false,
        data_type: 'number',
        sort_order: 13,
        category: 'Linjedetaljer',
        aliases: ['antall', 'qty', 'quantity', 'mengde', 'stk', 'pieces']
      },
      {
        field_key: 'enhet',
        field_label: 'Enhet',
        field_description: 'Måleenhet (stk, timer, kg)',
        is_required: false,
        data_type: 'text',
        sort_order: 14,
        category: 'Linjedetaljer',
        example_values: ['stk', 'timer', 'kg'],
        aliases: ['enhet', 'unit', 'måleenhet', 'stk', 'timer', 'kg', 'pcs', 'hours']
      },
      {
        field_key: 'enhetspris',
        field_label: 'Enhetspris',
        field_description: 'Pris per enhet',
        is_required: false,
        data_type: 'number',
        sort_order: 15,
        category: 'Linjedetaljer',
        aliases: ['enhetspris', 'unit_price', 'pris', 'price', 'stykksris', 'per_unit', 'unit_cost']
      }
    ]
  }
};

export const getUploadConfig = (uploadTypeId: string): UploadTypeConfig | null => {
  return UPLOAD_CONFIGS[uploadTypeId] || null;
};

export const getAllUploadConfigs = (): UploadTypeConfig[] => {
  return Object.values(UPLOAD_CONFIGS);
};