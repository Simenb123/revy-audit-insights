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
    name: 'Juridiske dokumenter', 
    description: 'Last opp juridiske dokumenter og kontrakter',
    icon: 'FileText',
    acceptedFileTypes: {
      '.pdf': ['application/pdf'],
      '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      '.doc': ['application/msword']
    },
    maxFileSize: 50 * 1024 * 1024, // 50MB
    maxFiles: 10,
    enableAISuggestions: false,
    enablePreview: false,
    processingSteps: [
      { id: 'upload', title: 'Last opp dokumenter' },
      { id: 'extract', title: 'Trekk ut metadata' },
      { id: 'categorize', title: 'Kategoriser dokumenter' },
      { id: 'save', title: 'Lagre til database' }
    ],
    fieldDefinitions: [
      {
        field_key: 'document_title',
        field_label: 'Dokumenttittel',
        is_required: true,
        data_type: 'text',
        sort_order: 1,
        category: 'Metadata',
        example_values: ['Arbeidskontrakt', 'Samarbeidsavtale', 'Leieavtale']
      },
      {
        field_key: 'document_type',
        field_label: 'Dokumenttype',
        is_required: true,
        data_type: 'text',
        sort_order: 2,
        category: 'Klassifikasjon',
        example_values: ['Kontrakt', 'Avtale', 'Juridisk dokument']
      },
      {
        field_key: 'party_names',
        field_label: 'Parter',
        is_required: false,
        data_type: 'text',
        sort_order: 3,
        category: 'Metadata',
        example_values: ['Eksempel AS, Test Bedrift AS', 'John Doe, Jane Smith']
      },
      {
        field_key: 'effective_date',
        field_label: 'Gyldig fra dato',
        is_required: false,
        data_type: 'date',
        sort_order: 4,
        category: 'Metadata',
        example_values: ['01.01.2024', '2024-01-01']
      },
      {
        field_key: 'expiry_date',
        field_label: 'Utløpsdato',
        is_required: false,
        data_type: 'date',
        sort_order: 5,
        category: 'Metadata',
        example_values: ['31.12.2024', '2024-12-31']
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