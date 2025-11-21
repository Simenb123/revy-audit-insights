# Migration Checklist – Revisjonshandlinger Refaktorering

Dette dokumentet inneholder en detaljert checklist for å refaktorere revisjonshandlinger-systemet.

**Basert på**: [architecture.md](./architecture.md) og [component-map.md](./component-map.md)

---

## ✅ Fase 1: Dokumentasjon og analyse
**Status**: ✅ Fullført  
**Tid brukt**: ~2 timer  

- [x] Lag fullstendig komponentkart med avhengigheter → [component-map.md](./component-map.md)
- [x] Skriv `docs/audit-actions/architecture.md` → Fullført
- [x] Identifiser ALL duplisert kode (>5 linjer) → Dokumentert i architecture.md
- [x] Lag "migration checklist" for hver komponent → Dette dokumentet

---

## 📦 Fase 2: Core abstractions (8 timer)
**Status**: ⏳ Ikke startet  
**Prioritet**: 🔴 Kritisk  

### 2.1 ActionCard Component (2 timer)
**Fil**: `src/components/AuditActions/core/ActionCard.tsx`

**Ansvar**:
- Universal card layout for templates og client actions
- Badge rendering (risk, status, phase, etc.)
- Checkbox og quick actions placement
- Responsive design

**Props**:
```typescript
interface ActionCardProps {
  type: 'template' | 'client-action';
  data: AuditActionTemplate | ClientAuditAction;
  selected?: boolean;
  onToggle?: (id: string) => void;
  onEdit?: (data: any) => void;
  onCopyToClient?: (id: string) => void;
  dragHandle?: React.ReactNode;
  showCheckbox?: boolean;
  showQuickActions?: boolean;
}
```

**Checklist**:
- [ ] Opprett komponent-fil
- [ ] Implementer badge utilities (`getBadgeVariant`, `getBadgeLabel`)
- [ ] Flytt `getRiskBadgeColor` fra 3 steder til felles utility
- [ ] Flytt `getSubjectAreaName` fra 2 steder til felles utility
- [ ] Implementer responsive layout (mobile/desktop)
- [ ] Test med både templates og client actions
- [ ] Skriv Storybook stories (optional)

**Erstatter**:
- `FlexibleActionTemplateList` lines 191-269
- `ActionRowBody` lines 19-64
- Deler av `EnhancedActionTemplateView`

---

### 2.2 ActionList Component (3 timer)
**Fil**: `src/components/AuditActions/core/ActionList.tsx`

**Ansvar**:
- Virtualisert liste med `@tanstack/react-virtual`
- Drag-n-drop support (optional via prop)
- Multi-select med keyboard shortcuts
- Empty state rendering
- Loading skeleton

**Props**:
```typescript
interface ActionListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  emptyState?: React.ReactNode;
  enableDragDrop?: boolean;
  enableVirtualization?: boolean;
  onReorder?: (items: T[]) => void;
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
  keyboardShortcuts?: boolean;
}
```

**Checklist**:
- [ ] Opprett komponent-fil
- [ ] Implementer virtualisering (wrap `useWindowVirtualizer`)
- [ ] Implementer drag-n-drop (wrap `@dnd-kit`)
- [ ] Implementer keyboard shortcuts (refaktorer fra ClientActionsList)
- [ ] Implementer empty state (refaktorer fra 6 steder)
- [ ] Implementer loading skeleton
- [ ] Test performance med 1000+ items
- [ ] Skriv unit tests

**Erstatter**:
- `ClientActionsList` lines 209-234 (virtualization)
- `ClientActionsList` lines 193-207 (DnD)
- Empty states i 6+ komponenter

---

### 2.3 ActionFilters Component (2 timer)
**Fil**: `src/components/AuditActions/core/ActionFilters.tsx`

**Ansvar**:
- Universal filter UI
- Search, risk, phase, status, AI filters
- "Select all visible" checkbox
- Filter count display

**Props**:
```typescript
interface ActionFiltersProps {
  filters: FilterConfig;
  onChange: (filters: FilterConfig) => void;
  showSelectAll?: boolean;
  allSelected?: boolean;
  onToggleSelectAll?: () => void;
  resultCount?: number;
  totalCount?: number;
}

interface FilterConfig {
  search?: string;
  risk?: RiskLevel | 'all';
  phase?: AuditPhase | 'all';
  status?: ActionStatus | 'all';
  aiEnabled?: boolean | 'all';
}
```

**Checklist**:
- [ ] Opprett komponent-fil
- [ ] Refaktorer filter UI fra ActionsFilterHeader
- [ ] Legg til support for alle filter-typer
- [ ] Implementer responsive layout
- [ ] Test at onChange triggeres riktig
- [ ] Skriv unit tests

**Erstatter**:
- `ActionsFilterHeader` (hele)
- Filter UI i `FlexibleActionTemplateList`
- Filter UI i `EnhancedActionTemplateList`

---

### 2.4 AuditActionsContext (1 time)
**Fil**: `src/contexts/AuditActionsContext.tsx`

**Ansvar**:
- Global state for selected actions
- Bulk operations state
- Filter state (optional)
- Undo/redo stack (future)

**API**:
```typescript
interface AuditActionsContextValue {
  // Selection
  selectedIds: string[];
  toggleSelect: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  
  // Bulk operations
  bulkUpdateStatus: (status: ActionStatus) => Promise<void>;
  bulkDelete: () => Promise<void>;
  
  // State
  isLoading: boolean;
  error: Error | null;
}
```

**Checklist**:
- [ ] Opprett context fil
- [ ] Implementer selection state
- [ ] Implementer bulk operations
- [ ] Legg til error handling
- [ ] Test at context fungerer på tvers av komponenter
- [ ] Skriv unit tests for reducer

**Erstatter**:
- `selectedIds` state i 3+ komponenter
- Bulk operation state

---

## 🎨 Fase 3: Migrer Templates (6 timer)
**Status**: ⏳ Ikke startet  
**Prioritet**: 🟠 Høy  

### 3.1 TemplateLibrary Component (3 timer)
**Fil**: `src/components/AuditActions/templates/TemplateLibrary.tsx`

**Ansvar**:
- Erstatte `FlexibleActionTemplateList` og `EnhancedActionTemplateList`
- Bruke `ActionCard` og `ActionList` fra Core
- Toggle mellom basic og enhanced view
- Multi-select og copy til klient

**Checklist**:
- [ ] Opprett komponent-fil
- [ ] Bruk `ActionList` for rendering
- [ ] Bruk `ActionCard` for items
- [ ] Bruk `ActionFilters` for filter UI
- [ ] Bruk `useTemplateFilters` hook
- [ ] Implementer view mode toggle
- [ ] Test at copy to client fungerer
- [ ] Test at filters fungerer

**Erstatter**:
- `FlexibleActionTemplateList.tsx` (278 linjer)
- `EnhancedActionTemplateList.tsx` (156 linjer)

---

### 3.2 Slett gamle template-komponenter (1 time)

**Checklist**:
- [ ] Slett `FlexibleActionTemplateList.tsx`
- [ ] Slett `EnhancedActionTemplateList.tsx`
- [ ] Slett `ActionTemplateList.tsx` (wrapper)
- [ ] Oppdater imports i `AuditActionsManager`
- [ ] Søk etter alle `FlexibleActionTemplateList` imports og erstatt
- [ ] Kjør tester for å verifisere ingen broken imports

---

### 3.3 Oppdater template-dialogs (2 timer)

**Filer**:
- `CreateActionTemplateDialog.tsx`
- `ImprovedCreateActionTemplateForm.tsx`

**Checklist**:
- [ ] Oppdater til å bruke nye core komponenter der relevant
- [ ] Test at create fungerer
- [ ] Test at edit fungerer
- [ ] Verifiser validering

---

## 🎯 Fase 4: Migrer Client Actions (6 timer)
**Status**: ⏳ Ikke startet  
**Prioritet**: 🟠 Høy  

### 4.1 Refaktorer ClientActionsList (4 timer)

**Fil**: `src/components/AuditActions/ClientActionsList.tsx`

**Endringer**:
- Bruk `ActionList` istedenfor egen virtualisering/DnD
- Bruk `ActionCard` istedenfor `ActionRowBody`
- Bruk `ActionFilters` istedenfor `ActionsFilterHeader`
- Bruk `AuditActionsContext` for selection state
- Bruk `BulkActionsToolbar` (beholdes)

**Checklist**:
- [ ] Refaktorer til å bruke `ActionList`
- [ ] Erstatt `ActionRowBody` med `ActionCard`
- [ ] Erstatt `ActionsFilterHeader` med `ActionFilters`
- [ ] Koble til `AuditActionsContext`
- [ ] Test drag-n-drop
- [ ] Test virtualisering
- [ ] Test keyboard shortcuts
- [ ] Test bulk operations
- [ ] Verifiser at all funksjonalitet fungerer

**Redusert linjekode**: 265 → ~150 (estimat)

---

### 4.2 Slett ActionRowBody og SortableActionRow (1 time)

**Checklist**:
- [ ] Slett `ActionRowBody.tsx`
- [ ] Slett `SortableActionRow.tsx`
- [ ] Oppdater imports i `ClientActionsList`
- [ ] Søk etter alle imports og erstatt
- [ ] Kjør tester

---

### 4.3 Test integrasjoner (1 time)

**Checklist**:
- [ ] Test at drawer åpning fungerer
- [ ] Test at new action dialog fungerer
- [ ] Test at progress indicator fungerer
- [ ] Test copy from client dialog
- [ ] End-to-end test av hele flyten

---

## 🌍 Fase 5: Data-drevet subject areas (4 timer)
**Status**: ⏳ Ikke startet  
**Prioritet**: 🟠 Høy  

### 5.1 Sjekk subject_areas tabell (30 min)

**Checklist**:
- [ ] Verifiser at `subject_areas` tabell er komplett
- [ ] Sjekk at alle hardkodede subject areas finnes i DB
- [ ] Verifiser at `display_name`, `icon`, `color` felter er fylt ut

---

### 5.2 Opprett useSubjectAreas hook (1 time)

**Fil**: `src/hooks/knowledge/useSubjectAreas.ts`

**Checklist**:
- [ ] Sjekk om hook allerede finnes (brukes av SubjectAreaNav)
- [ ] Hvis ikke: Opprett hook med React Query
- [ ] Legg til caching
- [ ] Test at hook fungerer

---

### 5.3 Erstatt hardkodet type (2 timer)

**Filer**:
- `src/types/audit-actions.ts`
- Alle komponenter som bruker `AuditSubjectArea`

**Endringer**:
```typescript
// BEFORE:
export type AuditSubjectArea = 
  | 'sales'
  | 'payroll'
  // ...

// AFTER:
export type AuditSubjectArea = string; // Fra subject_areas.name

// Eller:
export interface SubjectArea {
  id: string;
  name: string;
  display_name: string;
  icon?: string;
  color: string;
}
```

**Checklist**:
- [ ] Endre type-definisjon
- [ ] Erstatt `SUBJECT_AREA_LABELS` med dynamic lookup
- [ ] Oppdater alle komponenter som bruker hardkodede labels
- [ ] Test at dropdown/filter fungerer
- [ ] Test at nye subject areas kan legges til via DB

---

### 5.4 Test og valider (30 min)

**Checklist**:
- [ ] Test at alle dropdowns viser riktige verdier
- [ ] Test at farger vises riktig
- [ ] Test at ikoner vises riktig
- [ ] Test at nye subject areas kan legges til

---

## 🔄 Fase 6: Unifiser phase-håndtering (3 timer)
**Status**: ⏳ Ikke startet  
**Prioritet**: 🔴 Kritisk  

### 6.1 Opprett PHASE_CONFIG (1 time)

**Fil**: `src/constants/auditPhases.ts`

**Innhold**:
```typescript
import type { AuditPhase } from '@/types/revio';
import type { Database } from '@/integrations/supabase/types';

type DbPhase = Database['public']['Enums']['audit_phase'];

export const PHASE_CONFIG: Record<AuditPhase, {
  dbValue: DbPhase;
  label: string;
  icon?: string;
  color?: string;
}> = {
  engagement: {
    dbValue: 'engagement',
    label: 'Engasjement',
  },
  planning: {
    dbValue: 'planning',
    label: 'Planlegging',
  },
  risk_assessment: {
    dbValue: 'planning', // Maps til planning i DB
    label: 'Risikovurdering',
  },
  execution: {
    dbValue: 'execution',
    label: 'Utførelse',
  },
  completion: {
    dbValue: 'conclusion', // Maps til conclusion i DB
    label: 'Avslutning',
  },
  reporting: {
    dbValue: 'reporting',
    label: 'Rapportering',
  },
};

export const toDbPhase = (phase: AuditPhase): DbPhase => {
  return PHASE_CONFIG[phase].dbValue;
};

export const fromDbPhase = (dbPhase: DbPhase): AuditPhase => {
  const entry = Object.entries(PHASE_CONFIG).find(
    ([_, config]) => config.dbValue === dbPhase
  );
  return (entry?.[0] as AuditPhase) || 'execution';
};

export const getPhaseLabel = (phase: AuditPhase): string => {
  return PHASE_CONFIG[phase]?.label || phase;
};
```

**Checklist**:
- [ ] Opprett fil
- [ ] Definér `PHASE_CONFIG`
- [ ] Implementer `toDbPhase` / `fromDbPhase`
- [ ] Implementer `getPhaseLabel`
- [ ] Legg til unit tests

---

### 6.2 Fjern mapping-funksjoner (1 time)

**Filer**:
- `src/hooks/useAuditActions.ts`
- `src/hooks/audit-actions/useActionTemplateCRUD.ts`
- `src/hooks/useCopyActionsFromClient.ts`

**Checklist**:
- [ ] Erstatt `mapPhaseToDb` med `toDbPhase` fra PHASE_CONFIG
- [ ] Erstatt `mapPhaseFromDb` med `fromDbPhase` fra PHASE_CONFIG
- [ ] Slett lokale mapping-funksjoner
- [ ] Søk etter alle `mapPhase` imports og erstatt
- [ ] Test at queries fungerer

---

### 6.3 Oppdater komponenter (1 time)

**Filer**:
- Alle som bruker hardkodet phase labels
- `FlexibleActionTemplateList.tsx` (hvis ikke slettet ennå)
- `EnhancedActionTemplateView.tsx`
- `ActionRowBody.tsx`

**Checklist**:
- [ ] Erstatt inline phase mapping med `getPhaseLabel()`
- [ ] Erstatt `phaseLabels` import med `PHASE_CONFIG`
- [ ] Test at labels vises riktig
- [ ] Test at phase-filter fungerer

---

## 🧪 Fase 7: Testing og validering (4 timer)
**Status**: ⏳ Ikke startet  
**Prioritet**: 🟡 Medium  

### 7.1 Visuell testing (1 time)

**Checklist**:
- [ ] Test alle template-lister
- [ ] Test alle client action-lister
- [ ] Test drag-n-drop
- [ ] Test multi-select
- [ ] Test filter og søk
- [ ] Test responsive design (mobile/tablet/desktop)

---

### 7.2 Bulk operations testing (1 time)

**Checklist**:
- [ ] Test bulk status update
- [ ] Test bulk delete
- [ ] Test reorder
- [ ] Test keyboard shortcuts
- [ ] Test "select all visible"

---

### 7.3 AI tools testing (1 time)

**Checklist**:
- [ ] Test AI recommendations
- [ ] Test AI-enabled editor
- [ ] Test working paper generator
- [ ] Test document linker

---

### 7.4 Performance testing (1 time)

**Checklist**:
- [ ] Mål bundle size før/etter
- [ ] Mål render time med 1000+ items
- [ ] Test virtualisering performance
- [ ] Test filter performance
- [ ] Profiler med React DevTools

---

## 📚 Fase 8: Dokumentasjon og opprydding (3 timer)
**Status**: ⏳ Ikke startet  
**Prioritet**: 🟡 Medium  

### 8.1 Slett ubrukte komponenter (1 time)

**Checklist**:
- [ ] Søk etter komponenter som ikke importeres
- [ ] Slett component-filer
- [ ] Slett test-filer
- [ ] Oppdater `docs/audit-actions/component-map.md`

---

### 8.2 Oppdater dokumentasjon (1 time)

**Checklist**:
- [ ] Oppdater `docs/GETTING_STARTED.md`
- [ ] Oppdater `docs/audit-actions/architecture.md`
- [ ] Oppdater `docs/manage-audit-actions.md`
- [ ] Oppdater `docs/audit-action-generator.md`

---

### 8.3 Lag dev guide (1 time)

**Fil**: `docs/audit-actions/dev-guide.md`

**Innhold**:
- Hvordan legge til ny handlingsmal
- Hvordan legge til nytt fagområde
- Hvordan legge til ny fase
- Hvordan teste lokalt
- Troubleshooting

**Checklist**:
- [ ] Skriv dev guide
- [ ] Lag eksempler
- [ ] Lag Storybook stories (optional)

---

## 📊 Progresjon og estimater

| Fase | Status | Tid estimert | Tid brukt | Gjenstår |
|------|--------|--------------|-----------|----------|
| Fase 1: Dokumentasjon | ✅ Fullført | 5t | 2t | 0t |
| Fase 2: Core abstractions | ⏳ Ikke startet | 8t | 0t | 8t |
| Fase 3: Migrer Templates | ⏳ Ikke startet | 6t | 0t | 6t |
| Fase 4: Migrer Client Actions | ⏳ Ikke startet | 6t | 0t | 6t |
| Fase 5: Data-driven subject areas | ⏳ Ikke startet | 4t | 0t | 4t |
| Fase 6: Unifiser phase-håndtering | ⏳ Ikke startet | 3t | 0t | 3t |
| Fase 7: Testing | ⏳ Ikke startet | 4t | 0t | 4t |
| Fase 8: Dokumentasjon | ⏳ Ikke startet | 3t | 0t | 3t |
| **TOTALT** | **2,6% ferdig** | **39t** | **2t** | **37t** |

---

## ✅ Definition of Done (per fase)

For at en fase skal anses som fullført må:
1. ✅ Alle tasks i checklist være ferdig
2. ✅ All kode være testet og fungerer
3. ✅ Ingen console errors eller warnings
4. ✅ TypeScript kompilerer uten errors
5. ✅ Dokumentasjon være oppdatert
6. ✅ Code review være gjennomført (om relevant)

---

## 🚀 Hvordan bruke denne checklisten

1. **Start med Fase 2** - Core abstractions må være på plass først
2. **Jobb én fase om gangen** - Ikke hopp mellom faser
3. **Test underveis** - Ikke vent til slutten med testing
4. **Commit ofte** - Små, atomiske commits
5. **Oppdater denne filen** - Merk av tasks etterhvert
6. **Be om hjelp** - Hvis noe er uklart, spør før du fortsetter

---

## 📝 Notater og avvik

Bruk denne seksjonen til å notere ned ting som dukker opp underveis:

### Avvik fra plan
*(Skriv her om noe må gjøres annerledes enn planlagt)*

### Oppdagede problemer
*(Skriv her om du finner nye problemer som ikke er dokumentert)*

### Forbedringsforslag
*(Skriv her om du har forslag til hvordan ting kan gjøres bedre)*

---

**Sist oppdatert**: 2025-11-21  
**Neste review**: Etter Fase 2 ferdigstillelse
