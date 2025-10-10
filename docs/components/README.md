# Revio Components Inventory

En komplett oversikt over gjenbrukbare komponenter i Revio-plattformen.

---

## 📊 Data Display & Tables

### StandardDataTable & DataTable
**Lokasjon:** `src/components/ui/standard-data-table.tsx`, `src/components/ui/data-table.tsx`  
**Dokumentasjon:** [Data Tables Guide](./data-tables.md)  
**Brukt i:** 17+ steder (klienter, hovedbok, transaksjoner, etc.)

**Nøkkelfunksjoner:**
- Server-side sorting og paginering
- Virtualisering for store datasett
- Excel/PDF export
- Column manager (skjul/vis kolonner)
- Auto-alignment basert på datatype
- Norske defaults

**Quick start:**
```tsx
import { StandardDataTable } from '@/components/ui/standard-data-table';

<StandardDataTable
  data={myData}
  columns={columns}
  searchKeys={['name', 'email']}
  enableExport
/>
```

---

### PivotWidget
**Lokasjon:** `src/components/ReportBuilder/Widgets/PivotWidget.tsx`  
**Dokumentasjon:** [PivotWidget Guide](./pivot-widget.md)  
**Brukt i:** Report Builder, Analysis views

**Nøkkelfunksjoner:**
- Interaktiv pivot-analyse
- Drag-and-drop rows/columns
- Excel export
- Klient/gruppe scope-støtte
- Aggregering (sum, gjennomsnitt, etc.)

**Quick start:**
```tsx
import { PivotWidget } from '@/components/ReportBuilder/Widgets/PivotWidget';

<PivotWidget widget={widgetConfig} />
```

---

## 📝 Forms & Input

### FileUploadZone
**Lokasjon:** `src/components/ui/file-upload-zone.tsx`  
**Brukt i:** Alle upload-komponenter (17+ steder)

**Nøkkelfunksjoner:**
- Drag & drop interface
- Filtype-validering
- Bulk upload støtte
- Progress tracking

---

### RichTextEditor
**Lokasjon:** `src/components/RichTextEditor/`  
**Brukt i:** AI-Revy, Dokumenter, Arbeidsoppgaver

**Nøkkelfunksjoner:**
- Tiptap-basert editor
- Formatering (bold, italic, lister)
- Markdown støtte
- Bildeupload

---

## 🎨 Layout Components

### StandardPageLayout
**Lokasjon:** `src/components/Layout/StandardPageLayout.tsx`  
**Dokumentasjon:** [Page Layout Guide](../page-layout.md)

**Nøkkelfunksjoner:**
- Konsistent spacing
- Header/footer støtte
- Responsive sections

**Quick start:**
```tsx
import { StandardPageLayout } from '@/components/Layout/StandardPageLayout';

<StandardPageLayout spacing="comfortable">
  <Section title="Min seksjon">
    <p>Innhold her</p>
  </Section>
</StandardPageLayout>
```

---

### GlobalSubHeader & ClientSubHeader
**Lokasjon:** `src/components/Layout/GlobalSubHeader.tsx`, `src/components/Layout/ClientSubHeader.tsx`  
**Dokumentasjon:** [Page Layout Guide](../page-layout.md)

**Nøkkelfunksjoner:**
- Sticky positioning
- Revio-green styling (bg-revio-500)
- Action buttons
- Breadcrumbs

**Quick start:**
```tsx
import GlobalSubHeader from '@/components/Layout/GlobalSubHeader';

<GlobalSubHeader
  title="Min Side"
  actions={<Button>Legg til</Button>}
/>
```

---

### ConstrainedWidth & ResponsiveLayout
**Lokasjon:** `src/components/Layout/ConstrainedWidth.tsx`, `src/components/Layout/ResponsiveLayout.tsx`

**Nøkkelfunksjoner:**
- Max-width constraints (narrow, medium, wide, full)
- Sidebar-aware layout
- Responsive breakpoints

---

## 🤖 AI Components

### RevyChat
**Lokasjon:** `src/components/AI/RevyChat/`  
**Brukt i:** AI-Revy assistant

**Nøkkelfunksjoner:**
- Kontekstbevisst chat
- Markdown rendering
- Code blocks med syntax highlighting
- Typing indicators

---

### AIAnalysisCard
**Lokasjon:** `src/components/AI/AIAnalysisCard.tsx`

**Nøkkelfunksjoner:**
- AI-generert analyse display
- Expandable sections
- Export funksjonalitet

---

## 📈 Visualization

### ChartWidget
**Lokasjon:** `src/components/ReportBuilder/Widgets/ChartWidget.tsx`

**Nøkkelfunksjoner:**
- Recharts-baserte charts
- Line, bar, pie, area charts
- Responsive sizing
- Export to PNG

---

### KPIWidget
**Lokasjon:** `src/components/ReportBuilder/Widgets/KPIWidget.tsx`

**Nøkkelfunksjoner:**
- Single-value display
- Trend indicators
- Percentage changes
- Color-coded status

---

## 🔐 Authentication & Users

### UserAvatar
**Lokasjon:** `src/components/ui/avatar.tsx`

**Nøkkelfunksjoner:**
- Fallback initials
- Custom images
- Size variants

---

## 🎯 Specialized Components

### FormulaBuilder
**Lokasjon:** `src/components/KPI/FormulaBuilder.tsx`

**Nøkkelfunksjoner:**
- Visual formula editor
- Account selection
- Operator buttons
- Validation

---

### DocumentViewer
**Lokasjon:** `src/components/Documents/DocumentViewer.tsx`

**Nøkkelfunksjoner:**
- PDF rendering
- Pagination
- Zoom controls
- Fullscreen mode

---

### TransactionMatcher
**Lokasjon:** `src/components/Transactions/TransactionMatcher.tsx`

**Nøkkelfunksjoner:**
- Side-by-side comparison
- Bulk matching
- Confidence scores
- Manual override

---

## 📋 Common Patterns

### Loading States
```tsx
import { Skeleton } from '@/components/ui/skeleton';

{isLoading ? <Skeleton className="h-20" /> : <Content />}
```

### Error States
```tsx
import { Alert, AlertDescription } from '@/components/ui/alert';

{error && (
  <Alert variant="destructive">
    <AlertDescription>{error.message}</AlertDescription>
  </Alert>
)}
```

### Toast Notifications
```tsx
import { useToast } from '@/hooks/use-toast';

const { toast } = useToast();

toast({
  title: "Suksess",
  description: "Endringene er lagret",
});
```

---

## 🎨 Design System Components (shadcn/ui)

Alle shadcn/ui komponenter er tilgjengelige i `src/components/ui/`:

- **Buttons:** `button.tsx`
- **Dialogs:** `dialog.tsx`, `alert-dialog.tsx`
- **Forms:** `input.tsx`, `select.tsx`, `checkbox.tsx`, `radio-group.tsx`
- **Navigation:** `tabs.tsx`, `accordion.tsx`, `menubar.tsx`
- **Feedback:** `toast.tsx`, `progress.tsx`, `skeleton.tsx`
- **Data:** `table.tsx`, `card.tsx`, `badge.tsx`

**Se shadcn/ui dokumentasjon:** https://ui.shadcn.com/

---

## ✅ Best Practices

1. **Gjenbruk før du bygger nytt** - Sjekk denne listen før du lager nye komponenter
2. **Følg eksisterende patterns** - Se hvordan komponenten brukes andre steder
3. **Bruk TypeScript interfaces** - Alle komponenter skal ha type-safe props
4. **Dokumenter nye komponenter** - Legg til i denne filen når du lager gjenbrukbare komponenter
5. **Test responsivitet** - Alle komponenter skal fungere på mobil
6. **Bruk design tokens** - Ingen hardkodede farger, bruk CSS variabler fra index.css

---

**Sist oppdatert:** 2025-01-10  
**Vedlikeholdes av:** Revio Development Team
