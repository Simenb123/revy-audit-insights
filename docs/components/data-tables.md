# StandardDataTable & DataTable

## Oversikt

`StandardDataTable` er Revios primære komponente for visning av tabulære data. Den er brukt i **17+ komponenter** på tvers av hele applikasjonen og tilbyr kraftige features som søk, sortering, kolonnestyring, eksport og virtualisering.

### Bruksområder
- Klientlister (ClientsTable)
- Hovedbok (GeneralLedgerTable)
- Saldobalanse (TrialBalanceTable)
- Juridiske bestemmelser (LegalProvisionsTable)
- Faktureringssatser (BillingRatesManager)
- Lønnsinnsendinger (PayrollMonthlySubmissionsTab)
- AI-kunnskapsmonitor (KnowledgeMonitor)
- Revisjonsscenarier (ScenarioStatistics, TrainingReports)
- ++

## Komponenthierarki

```
StandardDataTable (standard-data-table.tsx)
└── DataTable (data-table.tsx) 
    ├── TableToolbar (søk, eksport, kolonnestyring)
    ├── ColumnManager (synlighet, pinning, rekkefølge)
    └── Table (shadcn/ui base table)
```

**StandardDataTable** = DataTable + norske defaults + auto-alignment + PDF eksport
**DataTable** = Base komponent med alle features (892 linjer)

---

## Quick Start

### 1. Grunnleggende bruk

```tsx
import StandardDataTable, { StandardDataTableColumn } from '@/components/ui/standard-data-table';

interface MyData {
  id: string;
  name: string;
  amount: number;
  date: string;
}

const MyTable = () => {
  const { data = [], isLoading, error } = useMyData();

  const columns: StandardDataTableColumn<MyData>[] = [
    {
      key: 'name',
      header: 'Navn',
      accessor: 'name',
      sortable: true,
      searchable: true
    },
    {
      key: 'amount',
      header: 'Beløp',
      accessor: 'amount',
      sortable: true,
      align: 'right', // Auto-detected hvis key inneholder 'beløp'
      format: (value) => `${value.toLocaleString('nb-NO')} kr`
    },
    {
      key: 'date',
      header: 'Dato',
      accessor: 'date',
      sortable: true,
      align: 'center',
      format: (value) => new Date(value).toLocaleDateString('nb-NO')
    }
  ];

  return (
    <StandardDataTable
      title="Min tabell"
      description="Beskrivelse av tabellen"
      data={data}
      columns={columns}
      isLoading={isLoading}
      error={error}
      tableName="my-table" // For lagring av kolonneinnstillinger
      exportFileName="min-tabell-export"
    />
  );
};
```

---

## Features

### ✅ Inkludert automatisk (via StandardDataTable)
- ✅ **Norske standarder**: Søk-placeholders, feilmeldinger, eksport-filnavn
- ✅ **Auto-alignment**: Beløp/tall høyrejustert, datoer sentrert
- ✅ **Norske tegn**: Automatisk sanitering av æ, ø, å
- ✅ **Sticky header**: Header følger med ved scrolling
- ✅ **Excel eksport**: Eksporter til .xlsx med riktig formatering
- ✅ **Kolonnestyring**: Vis/skjul, endre rekkefølge, pin til venstre
- ✅ **Loading states**: Skeleton loader mens data lastes
- ✅ **Error handling**: Automatisk error display

### 🔧 Valgfrie features
- **PDF eksport**: `enablePdfExport={true}` + `pdfTitle="Min rapport"`
- **Paginering**: `enablePagination={true}` + `pageSize={50}`
- **Virtualisering**: `virtualizeRows={true}` (for 10000+ rader)
- **Server-side sorting**: `enableServerSorting={true}` + `onSort={handleSort}`
- **Row click**: `onRowClick={(row) => handleClick(row)}`
- **Custom actions**: `toolbarCustomActions={<Button>Custom</Button>}`

---

## Kolonnedefinisjoner

### StandardDataTableColumn Interface

```typescript
export interface StandardDataTableColumn<T> {
  key: string;                                 // Unik identifikator
  header: string;                              // Kolonneoverskrift (norsk)
  accessor: keyof T | ((row: T) => any);       // Feltnavn eller funksjon
  sortable?: boolean;                          // Kan sorteres
  searchable?: boolean;                        // Inkluderes i søk
  format?: (value: any, row: T) => string | React.ReactNode; // Custom rendering
  sortAccessor?: (row: T) => any;              // Custom sorteringsverdi
  align?: 'left' | 'right' | 'center';         // Tekstjustering
  className?: string;                          // Custom CSS klasser
  required?: boolean;                          // Kan ikke skjules
  headerTooltip?: string;                      // Tooltip på header
}
```

### Eksempler på kolonner

```tsx
// 1. Enkel tekstkolonne
{
  key: 'name',
  header: 'Navn',
  accessor: 'name',
  sortable: true,
  searchable: true
}

// 2. Beløp (auto-høyrejustert hvis key inneholder 'beløp')
{
  key: 'beløp',
  header: 'Beløp',
  accessor: 'amount',
  sortable: true,
  format: (value) => `${value.toLocaleString('nb-NO')} kr`
}

// 3. Dato med custom format
{
  key: 'dato',
  header: 'Dato',
  accessor: 'date',
  sortable: true,
  align: 'center',
  format: (value) => new Date(value).toLocaleDateString('nb-NO')
}

// 4. Status badge med custom rendering
{
  key: 'status',
  header: 'Status',
  accessor: 'status',
  format: (value, row) => (
    <Badge variant={value === 'active' ? 'default' : 'secondary'}>
      {value}
    </Badge>
  )
}

// 5. Custom accessor funksjon
{
  key: 'fullName',
  header: 'Fullt navn',
  accessor: (row) => `${row.firstName} ${row.lastName}`,
  sortable: true,
  searchable: true
}

// 6. Actions kolonne (ikke påkrevd)
{
  key: 'actions',
  header: 'Handlinger',
  accessor: 'id',
  required: false, // Kan skjules
  format: (id, row) => (
    <div className="flex gap-2">
      <Button size="sm" onClick={() => handleEdit(row)}>Rediger</Button>
      <Button size="sm" variant="destructive" onClick={() => handleDelete(id)}>Slett</Button>
    </div>
  )
}
```

---

## Auto-alignment

StandardDataTable har **intelligent auto-alignment** basert på kolonnenøkkel:

```typescript
// Høyrejustert (align: 'right')
'beløp', 'amount', 'sum', 'pris', 'verdi', 'saldo', 'kr', 'nok'

// Sentrert (align: 'center')
'dato', 'date', 'tid', 'time'

// Venstrejustert (align: 'left') - default
Alt annet
```

**Override**: Sett `align` eksplisitt i kolonnedefinisjonen.

---

## Kolonnestyring & Views

### Preferences Key
`tableName` eller `preferencesKey` brukes til å lagre kolonneinnstillinger i localStorage:

```tsx
<StandardDataTable
  tableName="clients"
  // Lagres som 'standard-table-clients' i localStorage
/>
```

### Lagrede innstillinger
- ✅ Synlighet (vis/skjul kolonner)
- ✅ Rekkefølge (drag-and-drop)
- ✅ Pinning (lås kolonner til venstre)
- ✅ Views (lagre flere presets)

### Disable Views
Hvis du vil ha kolonnestyring uten "Lagre ny visning":

```tsx
<StandardDataTable
  tableName="my-table"
  disableViews={true}
  // Kolonnestyring fungerer, men ingen views dropdown
/>
```

---

## Eksport

### Excel Export (Standard)
Alltid inkludert, eksporterer synlige kolonner til `.xlsx`:

```tsx
<StandardDataTable
  exportFileName="klientliste-2025"
  data={clients}
  // ... 
/>
// Eksporterer som: klientliste-2025.xlsx
```

### PDF Export (Valgfri)
Aktiver PDF eksport med:

```tsx
<StandardDataTable
  enablePdfExport={true}
  pdfTitle="Klientliste 2025"
  pdfOrientation="landscape" // eller 'portrait'
  data={clients}
  // ...
/>
```

PDF-eksport:
- Inkluderer tittel og dato
- Respekterer kolonnejustering
- Fjerner HTML tags fra verdier
- Ekskluderer 'actions' kolonner

---

## Performance

### Virtualisering (10000+ rader)
For store datasett, aktiver virtualisering:

```tsx
<StandardDataTable
  data={hugeData} // 10000+ rader
  virtualizeRows={true}
  rowHeight={48} // Gjennomsnittlig radhøyde
  overscan={5} // Ekstra rader over/under viewport
  // ...
/>
```

### Server-side Sorting
For ekstremt store datasett (100k+ rader), bruk server-side sorting:

```tsx
const [sortBy, setSortBy] = useState('name');
const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

const handleSort = (newSortBy: string, newSortOrder: 'asc' | 'desc') => {
  setSortBy(newSortBy);
  setSortOrder(newSortOrder);
  // Fetch data fra server med ny sortering
  refetch();
};

<StandardDataTable
  enableServerSorting={true}
  onSort={handleSort}
  serverSortBy={sortBy}
  serverSortOrder={sortOrder}
  data={serverData}
  // ...
/>
```

---

## Layout & Styling

### Card Wrapper (Standard)
Wrappet i Card med header automatisk:

```tsx
<StandardDataTable
  wrapInCard={true} // Default
  title="Min tabell"
  description="Beskrivelse"
  icon={<DatabaseIcon />}
  // ...
/>
```

### Uten Card
Hvis du vil ha full kontroll:

```tsx
<StandardDataTable
  wrapInCard={false}
  // Ingen card wrapper, kun table
/>
```

### Sticky Header & Max Height
```tsx
<StandardDataTable
  stickyHeader={true} // Default
  maxBodyHeight="70vh" // Default, eller '500px', 600, etc.
  // Header følger med ved scrolling
/>
```

---

## Vanlige Use Cases

### 1. Enkel liste (Klienter, leverandører, etc.)
```tsx
const columns: StandardDataTableColumn<Client>[] = [
  { key: 'name', header: 'Navn', accessor: 'name', sortable: true, searchable: true },
  { key: 'org_number', header: 'Org.nr', accessor: 'organization_number', sortable: true },
  { key: 'industry', header: 'Bransje', accessor: 'industry', sortable: true }
];

<StandardDataTable
  title="Klienter"
  data={clients}
  columns={columns}
  tableName="clients"
  exportFileName="klientliste"
/>
```

### 2. Regnskapstabell med beløp
```tsx
const columns: StandardDataTableColumn<Transaction>[] = [
  { 
    key: 'date', 
    header: 'Dato', 
    accessor: 'date',
    align: 'center',
    format: (value) => new Date(value).toLocaleDateString('nb-NO')
  },
  { key: 'account', header: 'Konto', accessor: 'account_number' },
  { key: 'description', header: 'Beskrivelse', accessor: 'description', searchable: true },
  { 
    key: 'debit', 
    header: 'Debet', 
    accessor: 'debit_amount',
    align: 'right',
    format: (value) => value ? `${value.toLocaleString('nb-NO')} kr` : '-'
  },
  { 
    key: 'credit', 
    header: 'Kredit', 
    accessor: 'credit_amount',
    align: 'right',
    format: (value) => value ? `${value.toLocaleString('nb-NO')} kr` : '-'
  }
];
```

### 3. Tabell med actions
```tsx
const columns: StandardDataTableColumn<User>[] = [
  { key: 'name', header: 'Navn', accessor: 'name', sortable: true },
  { key: 'email', header: 'E-post', accessor: 'email', sortable: true },
  { 
    key: 'role', 
    header: 'Rolle', 
    accessor: 'role',
    format: (value) => <Badge>{value}</Badge>
  },
  { 
    key: 'actions', 
    header: 'Handlinger', 
    accessor: 'id',
    format: (id, row) => (
      <div className="flex gap-2">
        <Button size="sm" onClick={() => editUser(row)}>Rediger</Button>
        <Button size="sm" variant="destructive" onClick={() => deleteUser(id)}>Slett</Button>
      </div>
    )
  }
];
```

---

## Best Practices

### ✅ DO
- **Bruk StandardDataTable** fremfor DataTable direkte (får norske defaults gratis)
- **Angi `tableName`** for å lagre kolonneinnstillinger
- **Marker søkbare kolonner** med `searchable: true`
- **Bruk `format` funksjon** for custom rendering (datoer, beløp, badges)
- **Marker required kolonner** som ikke skal kunne skjules
- **Bruk auto-alignment** ved å navngi kolonner riktig (beløp, dato, etc.)

### ❌ DON'T
- **Ikke hardkod kolonnevisninger** - bruk kolonnestyring
- **Ikke lag custom table komponenter** - StandardDataTable har det du trenger
- **Ikke bruk inline styles** - bruk `className` og `format`
- **Ikke glem `isLoading` og `error` props** - brukerne trenger feedback
- **Ikke skip `exportFileName`** - default er generisk "data.xlsx"

---

## Troubleshooting

### Problem: Kolonner vises ikke
**Løsning**: Sjekk om de er skjult i kolonnestyring. Clear localStorage eller reset preferences.

### Problem: Søk fungerer ikke
**Løsning**: Merk kolonner med `searchable: true`. Søk fungerer kun på disse kolonnene.

### Problem: Sortering feil for tall
**Løsning**: Bruk `sortAccessor` for å returnere numerisk verdi:
```tsx
{
  key: 'amount',
  accessor: 'amount_str',
  sortAccessor: (row) => parseFloat(row.amount_str) || 0
}
```

### Problem: Norske tegn vises feil
**Løsning**: StandardDataTable håndterer dette automatisk. Hvis du bruker DataTable direkte, sett `enableNorwegianCharacters={true}`.

---

## Migrasjon til StandardDataTable

### Fra custom table komponenter

**Før:**
```tsx
<div>
  <Input placeholder="Søk..." onChange={handleSearch} />
  <Table>
    <TableHeader>
      <TableRow>
        {columns.map(col => <TableHead key={col.key}>{col.header}</TableHead>)}
      </TableRow>
    </TableHeader>
    <TableBody>
      {filteredData.map(row => (
        <TableRow key={row.id}>
          {columns.map(col => <TableCell key={col.key}>{row[col.key]}</TableCell>)}
        </TableRow>
      ))}
    </TableBody>
  </Table>
</div>
```

**Etter:**
```tsx
<StandardDataTable
  title="Min tabell"
  data={data}
  columns={columns}
  tableName="my-table"
  exportFileName="my-export"
/>
```

**Gevinst**: Færre linjer kode, mer funksjonalitet, konsistent design.

---

## Relaterte Komponenter

- **PivotWidget**: For pivot-analyse av data
- **ColumnManager**: Standalone kolonnestyring (brukes internt av DataTable)
- **TableToolbar**: Toolbar med søk, eksport, kolonnestyring (brukes internt)

---

## Files

```
src/components/ui/
  standard-data-table.tsx  (176 linjer) - StandardDataTable wrapper
  data-table.tsx          (892 linjer) - Base DataTable komponent
  column-manager.tsx                   - Kolonnestyring UI
  table-toolbar.tsx                    - Toolbar UI
  
src/hooks/
  useLocalStorage.ts                   - For lagring av preferences
  useDebounce.ts                       - For søk optimalisering
```

---

## Eksempler i Codebase

Se disse filene for komplette eksempler:
- `src/components/Clients/ClientsTable/ClientsTable.tsx` - Klientliste med actions
- `src/components/Accounting/GeneralLedgerTable.tsx` - Hovedbok med debet/kredit
- `src/components/Accounting/TrialBalanceTable.tsx` - Saldobalanse med mapping
- `src/components/Knowledge/LegalKnowledge/LegalProvisionsTable.tsx` - Juridiske bestemmelser
- `src/components/Revisorskolen/ScenarioStatistics.tsx` - Multiple tabeller i samme view

---

**Oppdatert:** 2025-10-10  
**Vedlikeholdes av:** Revio Development Team
