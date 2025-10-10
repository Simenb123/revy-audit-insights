# File Processing Utility

## Oversikt

`fileProcessing.ts` er Revios **mest kraftige gjenbrukbare utility** for håndtering av Excel og CSV filer. Den brukes i **17+ uploader-komponenter** og tilbyr automatisk kolonnemapping, header-deteksjon, datahåndtering og norsk språkstøtte.

**Størrelse:** 1483 linjer  
**Lokasjon:** `src/utils/fileProcessing.ts`

### Hovedfunksjoner
1. **Filprosessering**: Excel (.xlsx, .xls) og CSV parsing
2. **Auto-mapping**: Intelligent matching av kolonner til felt
3. **Header-deteksjon**: Automatisk finn header-rad i ustrukturerte filer
4. **Norsk språk**: Fuzzy matching av norske termer (æ, ø, å)
5. **Datavalidering**: Type-sjekk og content-validering
6. **Historikk**: Lær fra tidligere mappings

---

## Bruksområder i Revio

Brukes i disse uploader-komponentene:
- **TrialBalanceUploader** - Saldobalanse import
- **GeneralLedgerUploader** - Hovedbok import
- **ChartOfAccountsUploader** - Kontoplan import
- **ClientBulkImporter** - Masseopplasting av klienter
- **LawProvisionUploader** - Juridiske bestemmelser
- **ExcelImporter** - Generisk Excel import
- ++

---

## Quick Start

### 1. Excel Import med Auto-mapping

```typescript
import { 
  processExcelFile, 
  suggestColumnMappings, 
  TRIAL_BALANCE_FIELDS 
} from '@/utils/fileProcessing';

// 1. Les Excel-fil
const preview = await processExcelFile(file);

// 2. Få forslag til kolonnemapping
const mappings = suggestColumnMappings(
  preview.headers,
  TRIAL_BALANCE_FIELDS,
  preview.allRows.slice(0, 10) // Sample data for bedre matching
);

// 3. Bruk mappings til å transformere data
const transformedData = preview.allRows.map(row => {
  const obj: any = {};
  mappings.forEach(mapping => {
    const sourceIndex = preview.headers.indexOf(mapping.sourceColumn);
    obj[mapping.targetField] = row[sourceIndex];
  });
  return obj;
});
```

### 2. CSV Import

```typescript
import { processCSVFile, suggestColumnMappings, GENERAL_LEDGER_FIELDS } from '@/utils/fileProcessing';

const preview = await processCSVFile(file);
const mappings = suggestColumnMappings(
  preview.headers,
  GENERAL_LEDGER_FIELDS,
  preview.allRows.slice(0, 10)
);
```

---

## Hovedfunksjoner

### `processExcelFile(file, options?)`

Leser Excel-fil og returnerer strukturert preview.

**Parametere:**
```typescript
file: File                    // Excel-fil (.xlsx, .xls)
options?: {
  extraTerms?: string[]      // Ekstra termer for header-deteksjon
}
```

**Returnerer:**
```typescript
interface FilePreview {
  headers: string[];                         // Detekterte headers
  rows: any[][];                            // Preview (første 10 rader)
  allRows: any[][];                         // Full dataset
  hasHeaders: boolean;                      // true
  totalRows: number;                        // Totalt antall datarader
  headerRowIndex: number;                   // Index av header-rad
  skippedRows: { rowIndex: number; content: string[] }[]; // Rader før header
  originalRowNumbers: number[];             // Originale radnumre
}
```

**Eksempel:**
```typescript
const preview = await processExcelFile(file, {
  extraTerms: ['orgnr', 'organisasjonsnummer'] // Custom termer for header-deteksjon
});

console.log(preview.headers);        // ['Kontonummer', 'Kontonavn', 'Saldo']
console.log(preview.totalRows);      // 245
console.log(preview.headerRowIndex); // 2 (header var på rad 3)
console.log(preview.skippedRows);    // [{ rowIndex: 0, content: ['Rapport for 2024'] }, ...]
```

---

### `processCSVFile(file, options?)`

Leser CSV-fil med automatisk delimiter-deteksjon.

**Parametere:**
```typescript
file: File                             // CSV-fil
options?: {
  extraAliasHeaders?: string[]        // Ekstra aliases for mapping
}
```

**Returnerer:** Same som `processExcelFile`, pluss:
```typescript
{
  ...FilePreview,
  detectedDelimiter?: string          // ',' | ';' | '\t' | '|'
}
```

**Eksempel:**
```typescript
const preview = await processCSVFile(file, {
  extraAliasHeaders: ['orgnr', 'org nr', 'organisasjonsnummer']
});

console.log(preview.detectedDelimiter); // ';'
```

---

### `suggestColumnMappings(headers, fieldDefinitions, sampleData?, historicalMappings?)`

Foreslår mapping mellom fil-kolonner og target-felt med confidence score.

**Parametere:**
```typescript
headers: string[]                    // Headers fra fil
fieldDefinitions: FieldDefinition[]  // Target felt (TRIAL_BALANCE_FIELDS, etc.)
sampleData?: string[][]              // Sample data for content-validering (anbefalt!)
historicalMappings?: Record<string, string> // Tidligere mappings fra samme bruker
```

**Returnerer:**
```typescript
interface ColumnMapping {
  sourceColumn: string;    // 'Kontonr'
  targetField: string;     // 'account_number'
  confidence: number;      // 0.95 (0-1)
}[]
```

**Eksempel:**
```typescript
const mappings = suggestColumnMappings(
  ['Kontonr', 'Navn', 'Saldo i år'],
  TRIAL_BALANCE_FIELDS,
  preview.allRows.slice(0, 10), // Første 10 rader for validering
  { 'Kontonr': 'account_number' } // Historical mapping
);

// Resultat:
// [
//   { sourceColumn: 'Kontonr', targetField: 'account_number', confidence: 0.98 },
//   { sourceColumn: 'Navn', targetField: 'account_name', confidence: 0.92 },
//   { sourceColumn: 'Saldo i år', targetField: 'closing_balance', confidence: 0.89 }
// ]
```

**Matching Logic:**
1. **Historical mappings** (confidence: 0.98) - Eksakt match fra tidligere
2. **Alias matching** (confidence: 0.7-0.95) - Fuzzy match mot aliases
3. **Content validation** (boost: 1.1x) - Validerer datatype i sample
4. **Norwegian patterns** (boost: varies) - Støtte for æ, ø, å varianter

---

## Field Definitions

Pre-definerte field definitions for vanlige datatyper.

### `TRIAL_BALANCE_FIELDS`

For saldobalanse import:

```typescript
export const TRIAL_BALANCE_FIELDS: FieldDefinition[] = [
  {
    key: 'account_number',
    label: 'Kontonummer',
    required: true,
    type: 'text',
    aliases: ['kontonummer', 'account_number', 'konto', 'account', 'nummer']
  },
  {
    key: 'account_name',
    label: 'Kontonavn',
    required: true,
    type: 'text',
    aliases: ['kontonavn', 'account_name', 'navn', 'name', 'beskrivelse']
  },
  {
    key: 'closing_balance',
    label: 'Saldo i år',
    required: true,
    type: 'number',
    aliases: [
      'saldo i år', 'saldo_i_år', 'årets_saldo', 'utgående', 'closing', 
      'saldo', 'balance', 'sluttsaldo'
    ]
  },
  {
    key: 'opening_balance',
    label: 'Inngående saldo',
    required: false,
    type: 'number',
    aliases: ['inngående', 'åpning', 'opening', 'primo', 'primo_saldo']
  },
  {
    key: 'debit_turnover',
    label: 'Debet omsetning',
    required: false,
    type: 'number',
    aliases: ['debet', 'debit', 'skal', 'dr']
  },
  {
    key: 'credit_turnover',
    label: 'Kredit omsetning',
    required: false,
    type: 'number',
    aliases: ['kredit', 'credit', 'have', 'haver', 'cr']
  }
  // + account_type, regnskapsnr, regnskapsnr_resultat, regnskapsnr_balanse
];
```

### `GENERAL_LEDGER_FIELDS`

For hovedbok import:

```typescript
export const GENERAL_LEDGER_FIELDS: FieldDefinition[] = [
  {
    key: 'date',
    label: 'Dato',
    required: true,
    type: 'date',
    aliases: ['dato', 'date', 'bilagsdato', 'transaction_date']
  },
  {
    key: 'account_number',
    label: 'Kontonummer',
    required: true,
    type: 'text',
    aliases: ['kontonummer', 'account_number', 'konto']
  },
  {
    key: 'description',
    label: 'Beskrivelse',
    required: true,
    type: 'text',
    aliases: ['beskrivelse', 'description', 'tekst', 'bilagstekst']
  },
  {
    key: 'balance_amount',
    label: 'Beløp',
    required: false,
    type: 'number',
    aliases: [
      'beløp', 'amount', 'balance', 'saldo', 'kr', 'sum',
      'beløp nok', 'beløp kr', 'lokalt_beløp', 'transbeløp'
    ]
  },
  {
    key: 'debit_amount',
    label: 'Debet',
    required: false,
    type: 'number',
    aliases: ['debet', 'debit', 'debit_amount', 'skal']
  },
  {
    key: 'credit_amount',
    label: 'Kredit',
    required: false,
    type: 'number',
    aliases: ['kredit', 'credit', 'credit_amount', 'haver']
  },
  {
    key: 'voucher_number',
    label: 'Bilagsnummer',
    required: false,
    type: 'text',
    aliases: ['bilagsnummer', 'voucher_number', 'bilag', 'bilagsnr']
  }
  // + reference
];
```

### `CHART_OF_ACCOUNTS_FIELDS`

For kontoplan import:

```typescript
export const CHART_OF_ACCOUNTS_FIELDS: FieldDefinition[] = [
  {
    key: 'account_number',
    label: 'Kontonummer',
    required: true,
    type: 'text',
    aliases: ['kontonummer', 'account_number', 'konto']
  },
  {
    key: 'account_name',
    label: 'Kontonavn',
    required: true,
    type: 'text',
    aliases: ['kontonavn', 'account_name', 'navn']
  },
  {
    key: 'account_type',
    label: 'Kontotype',
    required: false,
    type: 'text',
    aliases: ['kontotype', 'account_type', 'type', 'kategori']
  },
  {
    key: 'parent_account_number',
    label: 'Overordnet konto',
    required: false,
    type: 'text',
    aliases: ['overordnet', 'parent', 'hovedkonto']
  }
];
```

---

## Lag Custom Field Definitions

For nye import-typer, definer egne fields:

```typescript
export const MY_CUSTOM_FIELDS: FieldDefinition[] = [
  {
    key: 'customer_id',           // Target felt i database
    label: 'Kunde-ID',            // Norsk label for UI
    required: true,               // Må være mappet
    type: 'text',                 // 'text' | 'number' | 'date'
    aliases: [                    // Alle varianter som kan matches
      'kunde', 'customer', 'customer_id', 'kundeid', 
      'kundenummer', 'customer_number'
    ]
  },
  {
    key: 'invoice_amount',
    label: 'Fakturabeløp',
    required: true,
    type: 'number',
    aliases: [
      'beløp', 'amount', 'fakturabeløp', 'invoice_amount',
      'sum', 'totalbeløp', 'total', 'kr', 'nok'
    ]
  },
  {
    key: 'invoice_date',
    label: 'Fakturadato',
    required: true,
    type: 'date',
    aliases: [
      'dato', 'date', 'fakturadato', 'invoice_date',
      'bilagsdato', 'utstedelsesdato'
    ]
  }
];

// Bruk i uploader:
const mappings = suggestColumnMappings(
  preview.headers,
  MY_CUSTOM_FIELDS,
  preview.allRows.slice(0, 10)
);
```

---

## Advanced Features

### 1. Header-deteksjon i ustrukturerte filer

Mange Excel-filer har tittel-rader før headers:

```
[Rad 0] Årsrapport 2024
[Rad 1] Generert: 01.01.2025
[Rad 2] 
[Rad 3] Kontonummer | Kontonavn | Saldo  <-- Dette er header
[Rad 4] 1000        | Kasse     | 5000
```

`processExcelFile()` detekterer automatisk header-rad ved å:
1. Lete etter rad med flest kjente termer
2. Validere at neste rader har konsistent struktur
3. Returnere skippede rader for logging

**Custom header-termer:**
```typescript
const preview = await processExcelFile(file, {
  extraTerms: ['orgnr', 'organisasjonsnummer', 'company_id']
});
```

### 2. Fuzzy Matching av norske tegn

Automatisk matching av variasjoner:
- `åpning` matcher `apning`, `aapning`, `opening`
- `beløp` matcher `belop`, `beloep`, `amount`
- `regnskapsnr` matcher `regnskap`, `regnskaps_nr`, `regnr`

### 3. Content-basert validering

Sample data brukes til å validere datatyper:

```typescript
// Hvis 'Kontonummer' kolonnen inneholder kun tall (1000, 2000, etc.)
// og field type er 'text', får den høyere confidence

const mappings = suggestColumnMappings(
  preview.headers,
  TRIAL_BALANCE_FIELDS,
  preview.allRows.slice(0, 10) // Sample for validering
);
```

**Type validation:**
- `number`: Sjekker at 80%+ av verdier er numeriske
- `date`: Sjekker at 80%+ av verdier er datoer
- `text`: Alltid gyldig

### 4. Historical Mappings

Lær fra tidligere imports:

```typescript
// Lagre mappings etter vellykket import
const historicalMappings: Record<string, string> = {
  'Kontonr': 'account_number',
  'Navn': 'account_name',
  'Saldo': 'closing_balance'
};
localStorage.setItem('trial_balance_mappings', JSON.stringify(historicalMappings));

// Bruk ved neste import
const stored = localStorage.getItem('trial_balance_mappings');
const historical = stored ? JSON.parse(stored) : undefined;

const mappings = suggestColumnMappings(
  preview.headers,
  TRIAL_BALANCE_FIELDS,
  preview.allRows.slice(0, 10),
  historical // Gir 0.98 confidence for eksakte matches
);
```

---

## Komplett Uploader Eksempel

```typescript
import React, { useState } from 'react';
import { 
  processExcelFile, 
  processCSVFile,
  suggestColumnMappings, 
  TRIAL_BALANCE_FIELDS,
  FilePreview,
  ColumnMapping 
} from '@/utils/fileProcessing';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const MyUploader = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<FilePreview | null>(null);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    try {
      setFile(selectedFile);

      // 1. Process file
      const extension = selectedFile.name.split('.').pop()?.toLowerCase();
      let filePreview: FilePreview;

      if (extension === 'csv') {
        filePreview = await processCSVFile(selectedFile);
      } else {
        filePreview = await processExcelFile(selectedFile);
      }

      setPreview(filePreview);

      // 2. Suggest mappings
      const suggestedMappings = suggestColumnMappings(
        filePreview.headers,
        TRIAL_BALANCE_FIELDS,
        filePreview.allRows.slice(0, 10)
      );

      setMappings(suggestedMappings);

      toast({
        title: "Fil lastet opp",
        description: `${filePreview.totalRows} rader funnet`,
      });
    } catch (error) {
      toast({
        title: "Feil ved filopplasting",
        description: error instanceof Error ? error.message : 'Ukjent feil',
        variant: "destructive",
      });
    }
  };

  const handleImport = async () => {
    if (!preview || !mappings.length) return;

    try {
      // 3. Transform data
      const transformedData = preview.allRows.map(row => {
        const obj: any = {};
        mappings.forEach(mapping => {
          const sourceIndex = preview.headers.indexOf(mapping.sourceColumn);
          obj[mapping.targetField] = row[sourceIndex];
        });
        return obj;
      });

      // 4. Import til database
      // ... Supabase insert logic

      toast({
        title: "Import vellykket",
        description: `${transformedData.length} rader importert`,
      });
    } catch (error) {
      toast({
        title: "Import feilet",
        description: error instanceof Error ? error.message : 'Ukjent feil',
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileSelect} />
      
      {preview && (
        <div>
          <h3>Preview ({preview.totalRows} rader)</h3>
          <table>
            <thead>
              <tr>
                {preview.headers.map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {preview.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => <td key={j}>{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>

          <h3>Foreslåtte Mappings</h3>
          <ul>
            {mappings.map(m => (
              <li key={m.sourceColumn}>
                {m.sourceColumn} → {m.targetField} ({Math.round(m.confidence * 100)}%)
              </li>
            ))}
          </ul>

          <Button onClick={handleImport}>Importer</Button>
        </div>
      )}
    </div>
  );
};
```

---

## Best Practices

### ✅ DO
- **Send sample data til suggestColumnMappings** - gir bedre matching
- **Bruk historical mappings** - lær fra tidligere imports
- **Definer gode aliases** - tenk på alle varianter brukere kan ha
- **Valider required fields** - sjekk at alle required fields er mappet
- **Lag custom field definitions** - ikke hack eksisterende
- **Logg skipped rows** - kan inneholde viktig metadata

### ❌ DON'T
- **Ikke anta header er på rad 0** - bruk `headerRowIndex`
- **Ikke skip content validation** - sample data gir bedre matching
- **Ikke hardkod kolonner** - bruk mappings for fleksibilitet
- **Ikke ignorer confidence scores** - warn brukeren ved lav confidence (<0.5)
- **Ikke skap for spesifikke aliases** - hold dem generelle

---

## Testing

Unit tester finnes i `src/utils/__tests__/fileProcessing.test.ts`:

```typescript
describe('detectCSVHeaderRow', () => {
  it('detects header row with minor spelling errors', () => {
    const rows = [
      ['noe', 'annet'],
      ['knto', 'beløpp', 'beskrvelse'], // Typos!
      ['1000', '200', 'test']
    ];
    expect(detectCSVHeaderRow(rows)).toBe(1); // Rad 1 er header
  });
});
```

---

## Troubleshooting

### Problem: Header ikke funnet
**Årsak:** Ukjente termer i header  
**Løsning:** Send `extraTerms` til `processExcelFile`:
```typescript
const preview = await processExcelFile(file, {
  extraTerms: ['din_custom_term', 'another_term']
});
```

### Problem: Lav confidence på mappings
**Årsak:** Mangler sample data eller dårlige aliases  
**Løsning:** 
1. Send sample data: `suggestColumnMappings(headers, fields, preview.allRows.slice(0, 10))`
2. Legg til flere aliases i field definitions

### Problem: Kolonne-merge i Excel
**Årsak:** Tom celle tolkes som merged  
**Løsning:** `processExcelFile` håndterer dette automatisk ved å fylle tomme celler med `''`

### Problem: Norske tegn vises feil
**Årsak:** Feil encoding i CSV  
**Løsning:** fileProcessing.ts håndterer dette automatisk med `normalizeNorwegianText()`

---

## Relaterte Utilities

- **secureXlsx.ts**: Sikker Excel-parsing (brukes internt av fileProcessing.ts)
- **exportToXlsx.ts**: Eksport til Excel
- **textSanitizer.ts**: Sanitering av norske tegn for visning

---

## Files

```
src/utils/
  fileProcessing.ts              (1483 linjer) - Main utility
  secureXlsx.ts                  - Sikker Excel parsing
  __tests__/fileProcessing.test.ts - Unit tests
  
Brukes i:
  src/components/Accounting/
    TrialBalanceUploader.tsx
    GeneralLedgerUploader.tsx
    ChartOfAccountsUploader.tsx
  src/components/Clients/
    ClientBulkImporter.tsx
  src/components/Knowledge/LegalKnowledge/
    LawProvisionUploader.tsx
  + 12 andre uploader-komponenter
```

---

**Oppdatert:** 2025-10-10  
**Vedlikeholdes av:** Revio Development Team
