# PivotWidget

## Oversikt

`PivotWidget` er en kraftig React-komponent for interaktiv pivot-analyse av regnskapsdata. Den lar brukere "tilte" tabeller 90 grader, analysere data på tvers av dimensjoner, aggregere verdier og eksportere resultater til Excel.

**Teknologi:** `react-pivottable` (0.11.0)  
**Lokasjon:** `src/components/ReportBuilder/Widgets/PivotWidget.tsx`

### Hovedfunksjoner
- ✅ **Interactive pivoting**: Drag-and-drop rader og kolonner
- ✅ **Datakilde-støtte**: Saldobalanse (trial balance) eller transaksjoner
- ✅ **Scope support**: Klient, firma eller custom scope (klientgruppe)
- ✅ **Excel export**: Eksporter pivot-data til .xlsx
- ✅ **Aggregering**: Sum, gjennomsnitt, min, max, etc.
- ✅ **Kolonnevalg**: Dynamisk kolonnevalg for custom scope (klient/konsern)

---

## Quick Start

### 1. Legg til PivotWidget i en rapport

```tsx
import { PivotWidget } from '@/components/ReportBuilder/Widgets/PivotWidget';
import { Widget } from '@/contexts/WidgetManagerContext';

const widget: Widget = {
  id: 'pivot-1',
  type: 'pivot',
  title: 'Saldobalanse Analyse',
  config: {
    clientId: 'client-123',
    dataSource: 'trial_balance',    // eller 'transactions'
    rowField: 'account_name',       // Rad-dimensjon
    columnField: undefined,         // Kolonne-dimensjon (optional)
    valueField: 'closing_balance'   // Verdi som aggregeres
  }
};

<PivotWidget widget={widget} />
```

### 2. Konfigurer med PivotWidgetConfig

```tsx
import { PivotWidgetConfig } from '@/components/ReportBuilder/WidgetConfiguration/PivotWidgetConfig';

const [config, setConfig] = useState<Record<string, any>>({
  dataSource: 'trial_balance',
  rowField: 'account_name',
  columnField: undefined,
  valueField: 'closing_balance'
});

const handleUpdate = (key: string, value: any) => {
  setConfig(prev => ({ ...prev, [key]: value }));
};

<PivotWidgetConfig config={config} onUpdate={handleUpdate} />
```

---

## Data Sources

PivotWidget støtter 2 datakilder:

### 1. Trial Balance (Saldobalanse)

```tsx
const widget: Widget = {
  id: 'pivot-tb',
  type: 'pivot',
  config: {
    dataSource: 'trial_balance',
    rowField: 'account_name',        // Kontonavn
    valueField: 'closing_balance'    // Saldo i år
  }
};
```

**Tilgjengelige felt:**
- `account_number` - Kontonummer
- `account_name` - Kontonavn
- `opening_balance` - Inngående saldo
- `debit_turnover` - Debet omsetning
- `credit_turnover` - Kredit omsetning
- `closing_balance` - Utgående saldo (saldo i år)
- `regnskapsnr` - Regnskapsnummer (for mapping)

### 2. Transactions (Transaksjoner)

```tsx
const widget: Widget = {
  id: 'pivot-tx',
  type: 'pivot',
  config: {
    dataSource: 'transactions',
    rowField: 'account_number',
    valueField: 'amount'
  }
};
```

**Tilgjengelige felt:**
- `transaction_date` - Transaksjonsdato
- `account_number` - Kontonummer
- `description` - Beskrivelse
- `amount` - Beløp (debet - kredit)

---

## Scope Support

PivotWidget håndterer 3 scope-typer fra `ScopeContext`:

### 1. Client Scope (Standard)

Analyse for én klient:

```tsx
const widget: Widget = {
  id: 'pivot-client',
  type: 'pivot',
  config: {
    clientId: 'client-123',
    dataSource: 'trial_balance',
    rowField: 'account_name',
    valueField: 'closing_balance'
  }
};

// Data kommer fra useTrialBalanceWithMappings eller useTransactions
// Scope context er 'client'
```

### 2. Firm Scope

Analyse på tvers av alle klienter i firma:

```tsx
// Scope context settes til 'firm'
// Data fetches fra get_firm_trial_balance_entries RPC
// columnField kan settes til 'client_name' for å se per klient
```

### 3. Custom Scope (Klientgruppe)

Analyse for utvalgte klienter:

```tsx
// Scope context settes til 'custom'
// selectedClientIds er array av klient-IDer
// Data fetches og grupperes automatisk
// Kolonnevalg: 'client_name' eller 'client_group'
```

**Dynamisk kolonnevalg i custom scope:**

```tsx
// Brukeren kan toggle kolonnevalg i UI:
<Button onClick={() => setColumnField('client_name')}>
  Kolonner: Klient
</Button>
<Button onClick={() => setColumnField('client_group')}>
  Kolonner: Konsern
</Button>
```

---

## Konfigurasjon

### Widget Config Interface

```typescript
interface WidgetConfig {
  clientId?: string;              // Klient-ID (for client scope)
  dataSource: 'trial_balance' | 'transactions';
  rowField?: string;              // Felt for rader (required)
  columnField?: string;           // Felt for kolonner (optional)
  valueField?: string;            // Felt for verdier (required)
}
```

### Field Options

**Trial Balance Fields:**
```typescript
const TRIAL_BALANCE_FIELDS = [
  { value: 'account_number', label: 'Kontonummer' },
  { value: 'account_name', label: 'Kontonavn' },
  { value: 'regnskapsnr', label: 'Regnskapsnummer' }
];

const TRIAL_BALANCE_VALUES = [
  { value: 'opening_balance', label: 'Inngående saldo' },
  { value: 'debit_turnover', label: 'Debet omsetning' },
  { value: 'credit_turnover', label: 'Kredit omsetning' },
  { value: 'closing_balance', label: 'Saldo i år' }
];
```

**Transaction Fields:**
```typescript
const TRANSACTION_FIELDS = [
  { value: 'transaction_date', label: 'Dato' },
  { value: 'account_number', label: 'Kontonummer' },
  { value: 'description', label: 'Beskrivelse' }
];

const TRANSACTION_VALUES = [
  { value: 'amount', label: 'Beløp' }
];
```

---

## Use Cases

### 1. Analyse av saldobalanse per konto

```tsx
const widget: Widget = {
  id: 'pivot-1',
  type: 'pivot',
  title: 'Saldobalanse per konto',
  config: {
    clientId: 'client-123',
    dataSource: 'trial_balance',
    rowField: 'account_name',
    valueField: 'closing_balance'
  }
};
```

**Resultat:**
```
Kontonavn              | Sum av Saldo i år
-----------------------|------------------
Kasse                  | 50 000
Bank                   | 250 000
Kundefordringer        | 180 000
...
```

### 2. Sammenligning på tvers av klienter

```tsx
// Sett scope til 'firm' eller 'custom'
const widget: Widget = {
  id: 'pivot-2',
  type: 'pivot',
  title: 'Sammenligning per klient',
  config: {
    dataSource: 'trial_balance',
    rowField: 'account_name',
    columnField: 'client_name',  // Hver klient blir en kolonne!
    valueField: 'closing_balance'
  }
};
```

**Resultat:**
```
Kontonavn          | Klient A | Klient B | Klient C | Total
-------------------|----------|----------|----------|-------
Kasse              | 50 000   | 30 000   | 20 000   | 100 000
Bank               | 250 000  | 180 000  | 120 000  | 550 000
Kundefordringer    | 180 000  | 90 000   | 60 000   | 330 000
...
Total              | 480 000  | 300 000  | 200 000  | 980 000
```

### 3. Transaksjonsanalyse per dato og konto

```tsx
const widget: Widget = {
  id: 'pivot-3',
  type: 'pivot',
  title: 'Transaksjoner per dato og konto',
  config: {
    clientId: 'client-123',
    dataSource: 'transactions',
    rowField: 'transaction_date',
    columnField: 'account_number',
    valueField: 'amount'
  }
};
```

**Resultat:**
```
Dato       | 1000  | 1500  | 3000  | Total
-----------|-------|-------|-------|-------
2024-01-15 | 5 000 | 2 000 | 1 000 | 8 000
2024-01-22 | 3 000 | 1 500 | 2 500 | 7 000
...
Total      | 8 000 | 3 500 | 3 500 | 15 000
```

### 4. Konsernanalyse (custom scope)

```tsx
// Scope context: custom
// selectedClientIds: ['client-1', 'client-2', 'client-3']

const widget: Widget = {
  id: 'pivot-4',
  type: 'pivot',
  title: 'Konsernanalyse',
  config: {
    dataSource: 'trial_balance',
    rowField: 'account_name',
    columnField: 'client_group',  // Gruppér per konsern
    valueField: 'closing_balance'
  }
};
```

**Resultat:**
```
Kontonavn          | Konsern X | Konsern Y | Total
-------------------|-----------|-----------|-------
Kasse              | 80 000    | 20 000    | 100 000
Bank               | 430 000   | 120 000   | 550 000
...
```

---

## Features

### 1. Interactive Pivoting

`react-pivottable` gir interaktiv drag-and-drop:

- **Drag row fields**: Flytt felt mellom rader og kolonner
- **Drag column fields**: Reorganiser kolonner
- **Change aggregator**: Velg Sum, Average, Count, Min, Max, etc.
- **Change renderer**: Table, Table Heatmap, Bar Chart, etc.

```tsx
<PivotTable
  data={currentData}
  rows={[rowField]}           // Array av rad-felt
  cols={[columnField]}        // Array av kolonne-felt
  vals={[valueField]}         // Array av verdi-felt
  aggregatorName="Sum"        // 'Sum' | 'Average' | 'Count' | ...
  rendererName="Table"        // 'Table' | 'Table Heatmap' | 'Bar Chart' | ...
/>
```

### 2. Excel Export

Export pivot-data til Excel:

```tsx
const handleExport = () => {
  exportArrayToXlsx('Pivotdata', currentData);
};

<Button onClick={handleExport}>Eksporter</Button>
```

### 3. Inline Editable Title

```tsx
<InlineEditableTitle
  title={widget.title}
  onTitleChange={(newTitle) => updateWidget(widget.id, { title: newTitle })}
  size="sm"
/>
```

---

## API

### usePivotData Hook

Brukes internt for å hente data basert på scope:

```typescript
const { data: pivotEntries = [] } = usePivotData({
  clientId,
  fiscalYear: selectedFiscalYear,
  rowField,
  columnField,
  valueField,
  scopeType,              // 'client' | 'firm' | 'custom'
  selectedClientIds,      // For custom scope
});
```

**Returnerer:**
```typescript
// Trial Balance data med optional client_name og client_group
{
  account_number: string;
  account_name: string;
  closing_balance: number;
  client_name?: string;    // For firm/custom scope
  client_group?: string;   // For custom scope
  // ...
}[]
```

---

## Styling & Layout

PivotWidget bruker Card layout:

```tsx
<Card className="h-full">
  <CardHeader className="pb-2 flex flex-row items-center justify-between">
    <InlineEditableTitle />
    <div className="flex items-center gap-2">
      {/* Kolonnevalg buttons */}
      <Button onClick={handleExport}>Eksporter</Button>
    </div>
  </CardHeader>
  <CardContent>
    <PivotTable {...props} />
  </CardContent>
</Card>
```

**CSS import for react-pivottable:**
```tsx
import 'react-pivottable/pivottable.css';
```

---

## Best Practices

### ✅ DO
- **Angi både rowField og valueField** - ellers vises ingen data
- **Bruk columnField strategisk** - for sammenligning på tvers av dimensjoner
- **Test med custom scope** - for konsernanalyse
- **Gi widgets beskrivende titler** - "Saldobalanse Q4" i stedet for "Pivot 1"
- **Eksporter til Excel** - brukerne liker å jobbe videre med data lokalt

### ❌ DON'T
- **Ikke bland datakilder** - velg enten trial_balance eller transactions
- **Ikke glem valueField** - uten verdi vises ingen aggregering
- **Ikke hardkod clientId** - bruk scope context for fleksibilitet
- **Ikke ignorer columnField i custom scope** - brukerne vil se per klient/gruppe

---

## Troubleshooting

### Problem: Ingen data vises
**Årsak:** Mangler rowField eller valueField  
**Løsning:** Sjekk at `config.rowField` og `config.valueField` er satt

### Problem: Feil datatype i pivot
**Årsak:** Blander trial balance og transaction fields  
**Løsning:** Velg riktig field options basert på `dataSource`

### Problem: Custom scope viser ikke klientnavn
**Årsak:** columnField ikke satt  
**Løsning:** Sett `columnField: 'client_name'` eller bruk toggle buttons

### Problem: Excel export er tom
**Årsak:** currentData er tomt  
**Løsning:** Sjekk at `hasData` er true før export

---

## Relaterte Komponenter

- **PivotWidgetConfig**: Konfigurasjonspanel for PivotWidget
- **usePivotData**: Hook for data-fetching basert på scope
- **StandardDataTable**: For flat table visning (ikke pivot)
- **ReportBuilder**: Container for widgets inkludert PivotWidget

---

## Files

```
src/components/ReportBuilder/
  Widgets/
    PivotWidget.tsx                       (125 linjer) - Main component
  WidgetConfiguration/
    PivotWidgetConfig.tsx                 (120 linjer) - Config panel
    
src/hooks/
  usePivotData.ts                         (97 linjer) - Data fetching hook
  
src/contexts/
  ScopeContext.tsx                        - Scope management
  FiscalYearContext.tsx                   - Fiscal year selection
```

---

**Oppdatert:** 2025-10-10  
**Vedlikeholdes av:** Revio Development Team
