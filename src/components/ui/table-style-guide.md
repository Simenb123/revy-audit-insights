# Revio Table Style Guide

## Standardiserte Tabeller på Tvers av Moduler

Dette dokumentet etablerer konsistente design patterns for alle tabeller i Revio-applikasjonen.

## StandardDataTable Komponent

Alle nye tabeller SKAL bruke `StandardDataTable` komponenten i stedet for primitive `Table` komponenter.

### Importering
```typescript
import StandardDataTable, { StandardDataTableColumn } from '@/components/ui/standard-data-table';
```

### Grunnleggende Bruk
```typescript
const columns: StandardDataTableColumn<DataType>[] = [
  {
    key: 'name',
    header: 'Navn',
    accessor: 'name',
    sortable: true,
    searchable: true
  }
];

<StandardDataTable
  title="Tabell Tittel"
  description="Beskrivelse av tabellen"
  data={data}
  columns={columns}
  tableName="unique-table-name"
  exportFileName="export-navn"
/>
```

## Standard Funksjoner (Inkludert Automatisk)

✅ **Søk og filtrering** - Automatisk på alle søkbare kolonner
✅ **Kolonnevalg** - "Velg kolonner" dropdown med lagring av preferanser
✅ **Export til Excel** - Automatisk export funksjonalitet
✅ **Sortering** - Klikk på kolonneheader for sortering
✅ **Loading states** - Automatisk loading skeleton
✅ **Error handling** - Standardiserte feilmeldinger
✅ **Responsive design** - Fungerer på mobil og desktop
✅ **Sticky headers** - Headers som ikke overlapper innhold
✅ **Norske tegn støtte** - Automatisk håndtering av æ, ø, å
✅ **Paginering** - Valgfritt, standard 50 elementer per side

## Design System Tokens

### Farger
Bruk ALLTID semantiske tokens fra design systemet:
- `bg-card` i stedet for `bg-white`
- `text-foreground` i stedet for `text-black`
- `text-muted-foreground` i stedet for `text-gray-500`
- `border` i stedet for `border-gray-200`

### Spacing
- `space-[var(--space-4)]` for standard gap
- `var(--content-gap)` for innholdsgap
- `var(--section-gap)` for seksjonsgap

### Typography
- Bruk relative størrelser: `text-sm`, `text-base`, `text-lg`
- Font weights: `font-medium`, `font-semibold`

## Kolonne Konfiguration

### Automatisk Justering
StandardDataTable justerer automatisk kolonner basert på innhold:
- **Høyre**: Beløp, tall, verdier (nøkkelord: 'beløp', 'amount', 'sum', 'pris', 'verdi', 'saldo', 'kr', 'nok')
- **Senter**: Datoer, tid (nøkkelord: 'dato', 'date', 'tid', 'time')
- **Venstre**: Tekst (standard)

### Kolonne Typer
```typescript
// Tekst kolonne
{
  key: 'name',
  header: 'Navn',
  accessor: 'name',
  sortable: true,
  searchable: true
}

// Beløp kolonne (auto høyrejustert)
{
  key: 'amount',
  header: 'Beløp',
  accessor: 'amount',
  sortable: true,
  format: (value) => formatCurrency(value)
}

// Dato kolonne (auto sentrert)
{
  key: 'created_at',
  header: 'Opprettet',
  accessor: 'created_at',
  sortable: true,
  format: (value) => new Date(value).toLocaleDateString('nb-NO')
}

// Status med badges
{
  key: 'status',
  header: 'Status',
  accessor: 'status',
  format: (value) => <Badge variant={getStatusVariant(value)}>{value}</Badge>
}

// Custom format
{
  key: 'actions',
  header: 'Handlinger',
  accessor: () => '',
  format: (_, row) => (
    <Button onClick={() => handleEdit(row.id)}>
      Rediger
    </Button>
  )
}
```

## Migrering av Eksisterende Tabeller

### Identifiserte Tabeller for Migrering
- ✅ `KnowledgeMonitor.tsx` - Migrert til StandardDataTable
- ✅ `BillingRatesManager.tsx` - Migrert til StandardDataTable  
- ✅ `PayrollEmployeesTab.tsx` - Migrert til StandardDataTable
- 🔄 `AccountMappingTable.tsx` - Kompleks, trenger custom tilnærming
- ⏳ `PayrollMonthlySubmissionsTab.tsx` - Planlagt
- ⏳ `DrillDownTable.tsx` - Planlagt
- ⏳ `TransactionSampling.tsx` - Planlagt

### Migreringsprosess
1. **Import StandardDataTable**
2. **Definer kolonner** med `StandardDataTableColumn<T>[]`
3. **Erstatt primitive Table** med StandardDataTable
4. **Test funksjonalitet** - søk, sortering, export
5. **Fjern gammel kode** - loading states, søk inputs, etc.

## Avanserte Funksjoner

### Server-side Sortering
```typescript
<StandardDataTable
  // ... andre props
  enableServerSorting={true}
  onSort={(sortBy, sortOrder) => handleServerSort(sortBy, sortOrder)}
  serverSortBy={currentSortBy}
  serverSortOrder={currentSortOrder}
/>
```

### Custom Row Actions
```typescript
{
  key: 'actions',
  header: '',
  accessor: () => '',
  format: (_, row) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => handleEdit(row)}>
          Rediger
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDelete(row)}>
          Slett
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

### Row Click Handling
```typescript
<StandardDataTable
  // ... andre props
  onRowClick={(row) => navigate(`/details/${row.id}`)}
  getRowClassName={(row) => row.isActive ? 'bg-green-50' : ''}
/>
```

## Performance Optimalisering

### Virtualisering for Store Datasett
```typescript
<StandardDataTable
  // ... andre props
  virtualizeRows={true}
  maxBodyHeight="70vh"
  rowHeight={48}
  overscan={5}
/>
```

### Paginering
```typescript
<StandardDataTable
  // ... andre props
  enablePagination={true}
  pageSize={50}
  totalCount={totalItems}
  currentPage={currentPage}
  onPageChange={setCurrentPage}
/>
```

## Accessibility

StandardDataTable inkluderer automatisk:
- ARIA labels for sortering
- Keyboard navigation
- Screen reader støtte
- Focus management

## Testing

Hver migrert tabell bør testes for:
- ✅ Søk fungerer på alle søkbare kolonner
- ✅ Sortering fungerer på alle sortable kolonner
- ✅ Export til Excel inneholder riktige data
- ✅ Kolonnevalg lagrer preferanser korrekt
- ✅ Loading states vises riktig
- ✅ Error states håndteres
- ✅ Responsive design fungerer
- ✅ Norske tegn vises korrekt

## Fremtidige Forbedringer

- [ ] Row expansion support
- [ ] Bulk actions (select multiple rows)
- [ ] Advanced filtering (date ranges, multi-select)
- [ ] Column resizing
- [ ] Column reordering
- [ ] Export to PDF
- [ ] Print functionality
- [ ] Dark mode optimization

## Kontakt

For spørsmål om tabellstandardisering, kontakt utviklingsteamet eller se dokumentasjonen i `docs/gpt5-dev-kit/component-templates/`.