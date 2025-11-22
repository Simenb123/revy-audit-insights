# Revisjonshandlinger - Utviklerguide

Denne guiden viser hvordan du jobber med revisjonshandlinger-systemet etter refaktoreringen.

---

## 📚 Innholdsfortegnelse

1. [Oversikt](#oversikt)
2. [Arkitektur](#arkitektur)
3. [Legge til ny handlingsmal](#legge-til-ny-handlingsmal)
4. [Legge til nytt fagområde](#legge-til-nytt-fagområde)
5. [Legge til ny fase](#legge-til-ny-fase)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

---

## Oversikt

Revisjonshandlinger-systemet er bygget med følgende prinsipper:

- **Gjenbrukbarhet**: Core komponenter (ActionCard, ActionList, ActionFilters) brukes på tvers av templates og client actions
- **Data-driven**: Fagområder og faser hentes fra database/constants, ikke hardkodet
- **Performance**: Virtualisering og bulk operations for store datasett
- **Type-safety**: Full TypeScript support med strict types

### Komponenthierarki

```
ActionsContainer (side-level)
├── TemplateLibrary (templates tab)
│   ├── ActionList (core, virtualisert)
│   │   └── ActionCard (core, universal)
│   ├── ActionFilters (core)
│   └── EnhancedTemplateView (enhanced view)
│
└── ClientActionsList (client actions tab)
    ├── ActionList (core, virtualisert)
    │   └── ActionCard (core, universal)
    ├── ActionFilters (core)
    ├── BulkActionsToolbar
    └── ActionDetailDrawer
```

---

## Arkitektur

### Core komponenter (`src/components/AuditActions/core/`)

**1. ActionCard.tsx**
- Universal card layout for både templates og client actions
- Props: `type`, `data`, `selected`, `onToggle`, `onEdit`, etc.
- Bruker `badgeUtils` for konsistent badge-styling

**2. ActionList.tsx**
- Virtualisert liste med @tanstack/react-virtual
- Drag-n-drop support med @dnd-kit (optional)
- Multi-select med keyboard shortcuts
- Props: `items`, `renderItem`, `enableVirtualization`, `enableDragDrop`, etc.

**3. ActionFilters.tsx**
- Universal filter UI
- Støtter search, risk, phase, status, AI filters
- "Select all visible" checkbox
- Props: `filters`, `onChange`, `showSelectAll`, etc.

**4. badgeUtils.ts**
- Felles utility-funksjoner for badges
- `getBadgeVariant()`, `getBadgeLabel()`, `getRiskBadgeColor()`, etc.
- Eliminerer duplisering på tvers av komponenter

### Context (`src/contexts/AuditActionsContext.tsx`)

Global state for:
- Selection state (`selectedIds`, `toggleSelect`, `selectAll`, `clearSelection`)
- Bulk operations (`bulkUpdateStatus`, `bulkDelete`)
- Loading og error state

### Hooks

**CRUD hooks** (`src/hooks/audit-actions/useActionTemplateCRUD.ts`):
- `useAuditActionTemplates()` - Query templates
- `useCreateAuditActionTemplate()` - Create template
- `useUpdateAuditActionTemplate()` - Update template
- `useDeleteAuditActionTemplate()` - Delete template

**Bulk operations** (`src/hooks/audit-actions/useClientActionBulk.ts`):
- `useBulkUpdateClientActionsStatus()`
- `useBulkDeleteClientActions()`
- `useReorderClientAuditActions()`

**Data-driven hooks**:
- `useSubjectAreaLabels()` - Hent fagområder fra database
- `PHASE_CONFIG` - Faser fra constants

---

## Legge til ny handlingsmal

### 1. Via UI (anbefalt for brukere)

Administratorer bruker UI-et:
1. Gå til **Kunnskapsbase → Revisjonshandlinger** i admin panel
2. Klikk **Ny handlingsmal**
3. Fyll inn:
   - Navn og beskrivelse
   - Fagområde (fra dropdown)
   - Risikonivå
   - Gjeldende faser
   - Prosedyrer og dokumentasjonskrav
4. Lagre

Mal blir automatisk tilgjengelig i relevante faser.

### 2. Via kode (for seeding eller migrasjon)

**Eksempel**: Legge til "Varelager - Fysisk telling" mal

```typescript
import { supabase } from '@/integrations/supabase/client';
import { AuditPhase, RiskLevel } from '@/types/audit-actions';

async function seedInventoryCountTemplate() {
  const { data, error } = await supabase
    .from('audit_action_templates')
    .insert({
      name: 'Varelager - Fysisk telling',
      description: 'Verifiser varelager gjennom fysisk telling og avstemming',
      subject_area: 'inventory', // eller subject_area_id UUID
      action_type: 'substantive_test',
      risk_level: 'medium' as RiskLevel,
      objective: 'Sikre at varelager eksisterer og er riktig verdsatt',
      procedures: `
        1. Planlegg fysisk telling med klient
        2. Observer telling og noter eventuelle avvik
        3. Avstem tellingsresultat mot regnskapssystem
        4. Dokumenter funn og konklusjoner
      `,
      documentation_requirements: 'Tellelister, avstemminger, observasjonsnotater',
      estimated_hours: 4,
      applicable_phases: ['execution'], // Array av AuditPhase
      sort_order: 10
    })
    .select()
    .single();

  if (error) {
    console.error('Error seeding template:', error);
    return;
  }

  console.log('Template created:', data);
}
```

### 3. Legg til ISA-mapping

```typescript
async function addISAMapping(templateId: string) {
  await supabase.from('audit_action_isa_mappings').insert({
    action_template_id: templateId,
    isa_standard_id: '<uuid-of-isa-501>', // ISA 501 - Audit Evidence
    relevance_level: 'high'
  });
}
```

### 4. Legg til dokumentkrav

```typescript
async function addDocumentRequirement(templateId: string) {
  const { data: docReq } = await supabase
    .from('document_requirements')
    .insert({
      name: 'Tellelister',
      description: 'Komplette tellelister fra fysisk varetelling',
      category: 'inventory',
      is_mandatory: true
    })
    .select()
    .single();

  await supabase.from('audit_action_document_mappings').insert({
    action_template_id: templateId,
    document_requirement_id: docReq.id,
    is_mandatory: true,
    timing: 'during_execution'
  });
}
```

---

## Legge til nytt fagområde

Fagområder er nå **data-driven** fra `subject_areas` tabellen.

### 1. Via database migration (anbefalt)

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_add_tax_subject_area.sql

INSERT INTO subject_areas (
  name,
  display_name,
  description,
  icon,
  color,
  is_active,
  sort_order
) VALUES (
  'tax',
  'Skatt',
  'Skatteberegning, skatteposisjoner og skatteoppgjør',
  'Receipt', -- Lucide icon navn
  'hsl(270, 70%, 60%)',
  true,
  60
);
```

### 2. Oppdater TypeScript types (om nødvendig)

Hvis du vil ha type-safety for legacy kode:

```typescript
// src/types/audit-actions.ts

export type LegacySubjectArea = 
  | 'sales'
  | 'payroll'
  // ... existing
  | 'tax'; // Legg til ny

// SUBJECT_AREA_LABELS er deprecated, men kan oppdateres for backward compatibility
export const SUBJECT_AREA_LABELS: Record<LegacySubjectArea, string> = {
  // ... existing
  tax: 'Skatt',
};
```

**Merk**: Moderne kode bruker `useSubjectAreaLabels()` hook og trenger ikke hardkodede typer.

### 3. Test at nytt fagområde vises

1. Kjør migration: `supabase db reset` (local) eller deploy
2. Åpne "Ny handlingsmal" dialog
3. Verifiser at "Skatt" vises i dropdown med riktig ikon og farge

---

## Legge til ny fase

Faser er definert i `src/constants/auditPhases.ts` (PHASE_CONFIG).

### 1. Oppdater PHASE_CONFIG

```typescript
// src/constants/auditPhases.ts

export const PHASE_CONFIG = {
  // ... existing phases
  
  reporting: {
    label: 'Rapportering',
    dbValue: 'reporting',
    description: 'Utarbeidelse av revisjonsberetning',
    icon: 'FileText'
  }
} as const;
```

### 2. Oppdater database enum (hvis nødvendig)

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_add_reporting_phase.sql

ALTER TYPE audit_phase ADD VALUE 'reporting';
```

**OBS**: PostgreSQL enum kan ikke fjerne verdier etter de er lagt til.

### 3. Oppdater TypeScript types

```typescript
// src/types/audit-actions.ts

export type AuditPhase = 
  | 'engagement'
  | 'planning'
  | 'execution'
  | 'review'
  | 'completion'
  | 'reporting'; // Ny fase
```

### 4. Test

1. Gå til klientside med revisjonshandlinger
2. Verifiser at "Rapportering" tab vises
3. Legg til handlingsmaler med `applicable_phases: ['reporting']`
4. Verifiser at de vises kun i Rapportering-fasen

---

## Testing

### Unit tests

Vi bruker Vitest og React Testing Library.

**Eksempel**: Test ActionCard

```typescript
// src/components/AuditActions/__tests__/ActionCard.test.tsx

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ActionCard from '../core/ActionCard';
import { AuditActionTemplate } from '@/types/audit-actions';

describe('ActionCard', () => {
  const mockTemplate: AuditActionTemplate = {
    id: '1',
    name: 'Test Template',
    subject_area: 'sales',
    risk_level: 'high',
    // ... andre påkrevde felter
  };

  it('renders template data correctly', () => {
    render(
      <ActionCard
        type="template"
        data={mockTemplate}
      />
    );

    expect(screen.getByText('Test Template')).toBeInTheDocument();
    expect(screen.getByText('Høy risiko')).toBeInTheDocument();
  });

  it('calls onToggle when checkbox is clicked', async () => {
    const onToggle = vi.fn();
    render(
      <ActionCard
        type="template"
        data={mockTemplate}
        showCheckbox
        onToggle={onToggle}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    await userEvent.click(checkbox);

    expect(onToggle).toHaveBeenCalledWith('1');
  });
});
```

### Performance testing

**usePerformanceMonitor hook**:

```typescript
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';

function MyComponent({ items }) {
  const { recordRender } = usePerformanceMonitor('MyComponent');

  useEffect(() => {
    recordRender();
  }, [items, recordRender]);

  // ... render
}
```

**Måle filter performance**:

```typescript
// src/components/AuditActions/__tests__/ActionFilters.test.tsx

it('filters quickly with 1000+ items', async () => {
  const items = generateMockActions(1000);
  
  const startTime = performance.now();
  const filtered = items.filter(item => 
    item.name.toLowerCase().includes('test')
  );
  const duration = performance.now() - startTime;

  expect(duration).toBeLessThan(100); // <100ms
});
```

### Manuell testing checklist

- [ ] Drag-n-drop reordering fungerer
- [ ] Multi-select med Ctrl/Cmd+A
- [ ] Bulk status update (5+ items)
- [ ] Filter og søk er responsive (<100ms)
- [ ] Virtualisering med 1000+ items (smooth scroll)
- [ ] Mobile layout (< 640px)
- [ ] Keyboard shortcuts (1-5, R, G, Esc)

---

## Troubleshooting

### Problem: "Subject area ikke funnet"

**Årsak**: Fagområde finnes ikke i `subject_areas` tabellen.

**Løsning**:
1. Sjekk database: `SELECT * FROM subject_areas WHERE name = 'sales';`
2. Kjør seed-script hvis tabellen er tom: `supabase/migrations/seed_subject_areas.sql`
3. Verifiser at `is_active = true`

### Problem: "Phase mapping feil"

**Årsak**: Database bruker enum verdier (snake_case), men koden bruker camelCase.

**Løsning**:
- Bruk alltid `toDbPhase()` og `fromDbPhase()` fra PHASE_CONFIG
- Eksempel: `toDbPhase('planning')` → `'planning'`

### Problem: "Virtualisering fungerer ikke"

**Årsak**: ActionList har ikke nok høyde til å aktivere virtualizer.

**Løsning**:
```typescript
<ActionList
  items={items}
  renderItem={renderItem}
  enableVirtualization={true}
  // Sørg for at parent har definert høyde
  style={{ height: '600px' }}
/>
```

### Problem: "Drag-n-drop overlapper med virtualisering"

**Årsak**: Kan ikke bruke begge samtidig.

**Løsning**:
- Bruk `enableDragDrop={true}` **eller** `enableVirtualization={true}`, ikke begge
- For store lister (>100 items): Bruk virtualisering
- For små lister med reorder: Bruk drag-n-drop

### Problem: "Bulk operations timeout"

**Årsak**: For mange items oppdateres samtidig.

**Løsning**:
```typescript
// Batch updates i chunks
async function bulkUpdateInChunks(ids: string[], status: string) {
  const CHUNK_SIZE = 50;
  
  for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
    const chunk = ids.slice(i, i + CHUNK_SIZE);
    await supabase
      .from('client_audit_actions')
      .update({ status })
      .in('id', chunk);
  }
}
```

### Problem: "TypeScript errors etter refaktorering"

**Årsak**: Gamle imports eller deprecated types.

**Løsning**:
1. Søk etter imports: `grep -r "FlexibleActionTemplateList" src/`
2. Erstatt med nye komponenter:
   - `FlexibleActionTemplateList` → `TemplateLibrary`
   - `ActionRowBody` → `ActionCard`
   - `ActionsFilterHeader` → `ActionFilters`
3. Kjør `npm run type-check`

### Problem: "Console warnings om missing keys"

**Årsak**: ActionList krever unique `id` på items.

**Løsning**:
```typescript
<ActionList
  items={items}
  renderItem={(item) => (
    <ActionCard
      key={item.id} // Alltid legg til key
      data={item}
    />
  )}
/>
```

---

## Beste praksis

### 1. Bruk alltid core komponenter

❌ **Ikke gjør**:
```typescript
// Lager egen card layout
function MyActionCard() {
  return (
    <div className="border rounded-lg p-4">
      {/* custom layout */}
    </div>
  );
}
```

✅ **Gjør**:
```typescript
import ActionCard from '@/components/AuditActions/core/ActionCard';

function MyComponent() {
  return <ActionCard type="template" data={template} />;
}
```

### 2. Bruk data-drevet subject areas

❌ **Ikke gjør**:
```typescript
const subjectAreaName = SUBJECT_AREA_LABELS['sales']; // Deprecated
```

✅ **Gjør**:
```typescript
import { useSubjectAreaLabels } from '@/hooks/audit-actions/useSubjectAreaLabels';

function MyComponent() {
  const { getLabel, options, isLoading } = useSubjectAreaLabels();
  
  return <span>{getLabel('sales')}</span>;
}
```

### 3. Bruk PHASE_CONFIG for faser

❌ **Ikke gjør**:
```typescript
const phaseLabel = phase === 'planning' ? 'Planlegging' : 'Ukjent';
```

✅ **Gjør**:
```typescript
import { getPhaseLabel } from '@/constants/auditPhases';

const phaseLabel = getPhaseLabel('planning'); // 'Planlegging'
```

### 4. Performance: Virtualiser store lister

```typescript
<ActionList
  items={items}
  renderItem={renderItem}
  enableVirtualization={items.length > 100} // Auto-enable for store lister
/>
```

### 5. Type-safety: Bruk enums og types

```typescript
import { RiskLevel, ActionStatus, AuditPhase } from '@/types/audit-actions';

function updateAction(status: ActionStatus) { // Type-safe
  // ...
}
```

---

## Nyttige kommandoer

```bash
# Kjør alle tester
npm test

# Kjør spesifikke tester
npm test ActionCard
npm test ClientActionsList

# Type-check
npm run type-check

# Lint
npm run lint

# Build for production
npm run build

# Supabase migrations
supabase db reset # Local reset med seed
supabase db push  # Push migrations til remote
```

---

## Ressurser

- **Arkitektur**: [docs/audit-actions/architecture.md](./architecture.md)
- **Component map**: [docs/audit-actions/component-map.md](./component-map.md)
- **Migration checklist**: [docs/audit-actions/migration-checklist.md](./migration-checklist.md)
- **Test results**: [docs/audit-actions/test-results.md](./test-results.md)
- **Brukerveiledning**: [docs/manage-audit-actions.md](../manage-audit-actions.md)

---

**Sist oppdatert**: 2025-11-22  
**Maintainer**: Revio Development Team
