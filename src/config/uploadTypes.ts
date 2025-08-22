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
        field_key: 'type_transaksjon',
        field_label: 'Type transaksjon',
        field_description: 'Type transaksjon som bestemmer bilagstype',
        is_required: true,
        data_type: 'text',
        sort_order: 1,
        category: 'Klassifikasjon',
        example_values: ['Salgsfaktura', 'Leverandørfaktura', 'Kundebetaling'],
        aliases: ['Type transaksjon', 'Type_transaksjon', 'Transaksjontype', 'type_transaksjon', 'type transaksjon', 'bilagstype', 'document_type']
      },
      {
        field_key: 'bilag',
        field_label: 'Bilag/Voucher',
        field_description: 'Bilagsnummer eller voucher nummer (ikke vist i PDF)',
        is_required: true,
        data_type: 'text',
        sort_order: 2,
        category: 'Identifikasjon',
        example_values: ['1001', 'VB001', 'FB2024001'],
        aliases: ['Bilag', 'bilag', 'voucher', 'bilagsnummer', 'bilagsnr', 'voucher_number', 'dok_nr', 'dokument']
      },
      {
        field_key: 'fakturanummer',
        field_label: 'Fakturanummer',
        field_description: 'Fakturanummer eller dokumentnummer',
        is_required: false,
        data_type: 'text',
        sort_order: 3,
        category: 'Identifikasjon',
        example_values: ['INV-2024-001', '12345'],
        aliases: ['Fakturanummer', 'fakturanummer', 'fakturanr', 'invoice', 'invoice_number', 'faktura', 'inv_nr']
      },
      {
        field_key: 'fakturadato',
        field_label: 'Fakturadato',
        field_description: 'Dato faktura ble utstedt',
        is_required: true,
        data_type: 'date',
        sort_order: 4,
        category: 'Dato',
        example_values: ['01.01.2024', '2024-01-01'],
        aliases: ['Fakturadato', 'fakturadato', 'invoice_date']
      },
      {
        field_key: 'bilagsdato',
        field_label: 'Bilagsdato',
        field_description: 'Dato for regnskapsføring eller bilagsregistrering',
        is_required: false,
        data_type: 'date',
        sort_order: 4.5,
        category: 'Dato',
        example_values: ['01.01.2024', '2024-01-01'],
        aliases: ['Bilagsdato', 'bilagsdato', 'dato', 'date', 'transaksjonsdato', 'regnskapsdato', 'voucher_date']
      },
      {
        field_key: 'forfallsdato',
        field_label: 'Forfallsdato',
        field_description: 'Forfallsdato for betaling',
        is_required: false,
        data_type: 'date',
        sort_order: 5,
        category: 'Dato',
        example_values: ['01.02.2024', '2024-02-01'],
        aliases: ['Forfallsdato', 'forfallsdato', 'due_date', 'payment_date', 'betalingsdato']
      },
      {
        field_key: 'leveringsdato',
        field_label: 'Leveringsdato',
        field_description: 'Leveringsdato for varer/tjenester',
        is_required: false,
        data_type: 'date',
        sort_order: 6,
        category: 'Dato',
        example_values: ['15.01.2024', '2024-01-15'],
        aliases: ['Leveringsdato', 'leveringsdato', 'delivery_date', 'levering']
      },
      {
        field_key: 'kundenavn',
        field_label: 'Kundenavn',
        field_description: 'Navn på kunde',
        is_required: false,
        data_type: 'text',
        sort_order: 7,
        category: 'Motpart',
        example_values: ['Acme AS', 'John Doe'],
        aliases: ['Kundenavn', 'kundenavn', 'kunde', 'customer', 'customer_name']
      },
      {
        field_key: 'leverandornavn',
        field_label: 'Leverandørnavn',
        field_description: 'Navn på leverandør',
        is_required: false,
        data_type: 'text',
        sort_order: 8,
        category: 'Motpart',
        example_values: ['Supplier AS', 'Vendor AB'],
        aliases: ['Leverandørnavn', 'leverandørnavn', 'LEVERANDØRNAVN', 'Leverandornavn', 'leverandornavn', 'LEVERANDORNAVN', 'leverandør', 'Leverandør', 'LEVERANDØR', 'leverandor', 'Leverandor', 'LEVERANDOR', 'supplier', 'Supplier', 'SUPPLIER', 'vendor', 'Vendor', 'VENDOR', 'supplier_name', 'Supplier_name', 'Supplier Name', 'SUPPLIER_NAME', 'vendor_name', 'Vendor_name', 'Vendor Name', 'VENDOR_NAME']
      },
      {
        field_key: 'kundeadresse',
        field_label: 'Kundeadresse',
        field_description: 'Adresse til kunde',
        is_required: false,
        data_type: 'text',
        sort_order: 9,
        category: 'Motpart',
        aliases: ['Kundeadresse', 'kundeadresse', 'customer_address']
      },
      {
        field_key: 'leverandoradresse',
        field_label: 'Leverandøradresse',
        field_description: 'Adresse til leverandør',
        is_required: false,
        data_type: 'text',
        sort_order: 10,
        category: 'Motpart',
        aliases: ['Leverandøradresse', 'leverandøradresse', 'supplier_address', 'vendor_address']
      },
      {
        field_key: 'beskrivelse',
        field_label: 'Beskrivelse',
        field_description: 'Tekst eller beskrivelse av transaksjon',
        is_required: false,
        data_type: 'text',
        sort_order: 11,
        category: 'Beskrivelse',
        example_values: ['Salg av tjenester', 'Innkjøp av varer'],
        aliases: ['Beskrivelse', 'beskrivelse', 'tekst', 'text', 'description', 'bilagstekst', 'forklaring', 'kommentar']
      },
      {
        field_key: 'netto_belop',
        field_label: 'Netto beløp',
        field_description: 'Nettobeløp uten MVA (grunnlag for MVA-beregning)',
        is_required: false,
        data_type: 'number',
        sort_order: 12,
        category: 'Beløp',
        aliases: ['Netto beløp', 'netto beløp', 'NETTO BELØP', 'netto_beløp', 'Netto_beløp', 'NETTO_BELØP', 'nettobeløp', 'Nettobeløp', 'NETTOBELØP', 'netto belop', 'Netto belop', 'NETTO BELOP', 'netto_belop', 'Netto_belop', 'NETTO_BELOP', 'nettobelop', 'Nettobelop', 'NETTOBELOP', 'netto', 'Netto', 'NETTO', 'net_amount', 'Net_amount', 'Net Amount', 'NET_AMOUNT', 'beløp_netto', 'Beløp_netto', 'BELØP_NETTO', 'belop_netto', 'Belop_netto', 'BELOP_NETTO', 'amount_ex_vat', 'Amount_ex_vat', 'Amount Ex VAT', 'AMOUNT_EX_VAT']
      },
      {
        field_key: 'mva_grunnlag',
        field_label: 'MVA-grunnlag',
        field_description: 'Grunnlaget som MVA beregnes fra (ofte samme som netto beløp)',
        is_required: false,
        data_type: 'number',
        sort_order: 13,
        category: 'MVA',
        aliases: ['MVA-grunnlag', 'mva-grunnlag', 'MVA grunnlag', 'mva grunnlag', 'MVA_grunnlag', 'mva_grunnlag', 'mvagramnlag', 'momsgrunnlag', 'vat_base', 'tax_base']
      },
      {
        field_key: 'mva_sats',
        field_label: 'MVA-sats',
        field_description: 'MVA-prosent (25, 15, 0)',
        is_required: false,
        data_type: 'number',
        sort_order: 14,
        category: 'MVA',
        aliases: ['MVA-sats', 'mva-sats', 'MVA-SATS', 'MvA-sats', 'mVA-sats', 'MVA sats', 'Mva sats', 'mva sats', 'MVA SATS', 'MvA sats', 'mVA sats', 'mva_sats', 'Mva_sats', 'MVA_sats', 'MVA_SATS', 'mvasats', 'Mvasats', 'MVAsats', 'MVASATS', 'mva', 'Mva', 'MVA', 'mvakode', 'Mvakode', 'MVAkode', 'MVAKODE', 'mva_kode', 'Mva_kode', 'MVA_kode', 'MVA_KODE', 'vat_rate', 'Vat_rate', 'VAT_rate', 'VAT Rate', 'VAT_RATE', 'tax_rate', 'Tax_rate', 'TAX_RATE', 'Tax Rate', 'skattesats', 'Skattesats', 'SKATTESATS', 'sats', 'Sats', 'SATS']
      },
      {
        field_key: 'mva_belop',
        field_label: 'MVA-beløp',
        field_description: 'MVA-beløp i kroner',
        is_required: false,
        data_type: 'number',
        sort_order: 15,
        category: 'MVA',
        aliases: ['MVA-beløp', 'mva-beløp', 'MVA-BELØP', 'MvA-beløp', 'mVA-beløp', 'MVA beløp', 'Mva beløp', 'mva beløp', 'MVA BELØP', 'MvA beløp', 'mVA beløp', 'mva_beløp', 'Mva_beløp', 'MVA_beløp', 'MVA_BELØP', 'mvabeløp', 'Mvabeløp', 'MVAbeløp', 'MVABELØP', 'mva-belop', 'Mva-belop', 'MVA-belop', 'MVA-BELOP', 'MVA belop', 'Mva belop', 'mva belop', 'MVA BELOP', 'MvA belop', 'mVA belop', 'mva_belop', 'Mva_belop', 'MVA_belop', 'MVA_BELOP', 'mvabelop', 'Mvabelop', 'MVAbelop', 'MVABELOP', 'momsbeløp', 'Momsbeløp', 'MOMSBELØP', 'momsbelop', 'Momsbelop', 'MOMSBELOP', 'vat_amount', 'Vat_amount', 'VAT_amount', 'VAT Amount', 'VAT_AMOUNT', 'tax_amount', 'Tax_amount', 'TAX_AMOUNT', 'Tax Amount', 'skattebeløp', 'Skattebeløp', 'SKATTEBELØP', 'skattebelop', 'Skattebelop', 'SKATTEBELOP']
      },
      {
        field_key: 'total_belop',
        field_label: 'Total beløp',
        field_description: 'Totalt beløp inkludert MVA (brutto)',
        is_required: false,
        data_type: 'number',
        sort_order: 16,
        category: 'Beløp',
        aliases: ['Total beløp', 'total beløp', 'TOTAL BELØP', 'total_beløp', 'Total_beløp', 'TOTAL_BELØP', 'totalbeløp', 'Totalbeløp', 'TOTALBELØP', 'total belop', 'Total belop', 'TOTAL BELOP', 'total_belop', 'Total_belop', 'TOTAL_BELOP', 'totalbelop', 'Totalbelop', 'TOTALBELOP', 'brutto', 'Brutto', 'BRUTTO', 'brutto_beløp', 'Brutto_beløp', 'BRUTTO_BELØP', 'bruttobeløp', 'Bruttobeløp', 'BRUTTOBELØP', 'beløp', 'Beløp', 'BELØP', 'belop', 'Belop', 'BELOP', 'amount', 'Amount', 'AMOUNT', 'total_amount', 'Total_amount', 'Total Amount', 'TOTAL_AMOUNT', 'gross_amount', 'Gross_amount', 'Gross Amount', 'GROSS_AMOUNT']
      },
      {
        field_key: 'debet',
        field_label: 'Debet',
        field_description: 'Debetbeløp for journalposteringer',
        is_required: false,
        data_type: 'number',
        sort_order: 17,
        category: 'Journal',
        aliases: ['Debet', 'debet', 'DEBET', 'debit', 'Debit', 'DEBIT', 'debet_beløp', 'Debet_beløp', 'DEBET_BELØP', 'debetbeløp', 'Debetbeløp', 'DEBETBELØP', 'debet_amount', 'Debet_amount', 'DEBET_AMOUNT']
      },
      {
        field_key: 'kredit',
        field_label: 'Kredit',
        field_description: 'Kreditbeløp for journalposteringer',
        is_required: false,
        data_type: 'number',
        sort_order: 18,
        category: 'Journal',
        aliases: ['Kredit', 'kredit', 'KREDIT', 'credit', 'Credit', 'CREDIT', 'kredit_beløp', 'Kredit_beløp', 'KREDIT_BELØP', 'kreditbeløp', 'Kreditbeløp', 'KREDITBELØP', 'kredit_amount', 'Kredit_amount', 'KREDIT_AMOUNT']
      },
      {
        field_key: 'antall',
        field_label: 'Antall',
        field_description: 'Antall enheter',
        is_required: false,
        data_type: 'number',
        sort_order: 19,
        category: 'Linjedetaljer',
        aliases: ['Antall', 'antall', 'qty', 'quantity', 'mengde', 'stk', 'pieces']
      },
      {
        field_key: 'enhet',
        field_label: 'Enhet',
        field_description: 'Måleenhet (stk, timer, kg)',
        is_required: false,
        data_type: 'text',
        sort_order: 20,
        category: 'Linjedetaljer',
        example_values: ['stk', 'timer', 'kg'],
        aliases: ['Enhet', 'enhet', 'unit', 'måleenhet', 'stk', 'timer', 'kg', 'pcs', 'hours']
      },
      {
        field_key: 'enhetspris',
        field_label: 'Enhetspris',
        field_description: 'Pris per enhet',
        is_required: false,
        data_type: 'number',
        sort_order: 21,
        category: 'Linjedetaljer',
        aliases: ['Enhetspris', 'enhetspris', 'unit_price', 'pris', 'price', 'stykksris', 'per_unit', 'unit_cost']
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