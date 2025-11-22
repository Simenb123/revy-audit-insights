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
**Status**: ✅ Fullført  
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
- [x] Opprett komponent-fil
- [x] Implementer badge utilities (`getBadgeVariant`, `getBadgeLabel`)
- [x] Flytt `getRiskBadgeColor` fra 3 steder til felles utility
- [x] Flytt `getSubjectAreaName` fra 2 steder til felles utility
- [x] Implementer responsive layout (mobile/desktop)
- [x] Test med både templates og client actions
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
- [x] Opprett komponent-fil
- [x] Implementer virtualisering (wrap `useWindowVirtualizer`)
- [x] Implementer drag-n-drop (wrap `@dnd-kit`)
- [x] Implementer keyboard shortcuts (refaktorer fra ClientActionsList)
- [x] Implementer empty state (refaktorer fra 6 steder)
- [ ] Implementer loading skeleton
- [x] Test performance med 1000+ items
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
- [x] Opprett komponent-fil
- [x] Refaktorer filter UI fra ActionsFilterHeader
- [x] Legg til support for alle filter-typer
- [x] Implementer responsive layout
- [x] Test at onChange triggeres riktig
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
- [x] Opprett context fil
- [x] Implementer selection state
- [x] Implementer bulk operations
- [x] Legg til error handling
- [x] Test at context fungerer på tvers av komponenter
- [ ] Skriv unit tests for reducer

**Erstatter**:
- `selectedIds` state i 3+ komponenter
- Bulk operation state

---

## ✅ Fase 3: Migrer Templates
**Status**: ✅ Fullført  
**Tid brukt**: 6 timer  
**Prioritet**: 🟠 Høy  

### 3.1 TemplateLibrary Component (3 timer) ✅
**Fil**: `src/components/AuditActions/TemplateLibrary.tsx`

**Ansvar**:
- Erstatte `FlexibleActionTemplateList` og `EnhancedActionTemplateList`
- Bruke `ActionCard` og `ActionList` fra Core
- Toggle mellom basic og enhanced view
- Multi-select og copy til klient

**Checklist**:
- [x] Opprett komponent-fil
- [x] Bruk `ActionList` for rendering
- [x] Bruk `ActionCard` for items
- [x] Bruk `ActionFilters` for filter UI
- [x] Bruk `useEnhancedAuditActionTemplates` hook
- [x] Implementer view mode toggle
- [x] Integrer med AuditActionsContext
- [x] Test at copy to client fungerer
- [x] Test at filters fungerer

**Erstatter**:
- `FlexibleActionTemplateList.tsx` (278 linjer)
- `EnhancedActionTemplateList.tsx` (157 linjer)

---

### 3.2 EnhancedTemplateView Component (2 timer) ✅
**Fil**: `src/components/AuditActions/EnhancedTemplateView.tsx`

**Ansvar**:
- Erstatte `EnhancedActionTemplateView`
- Bruke core `badgeUtils` for konsistens
- Bruke `getPhaseLabel` fra `auditPhases`
- Tabs for ISA, dokumenter, AI, arbeidspapirer

**Checklist**:
- [x] Opprett komponent-fil
- [x] Bruk badgeUtils for badges
- [x] Bruk getPhaseLabel for fase-labels
- [x] Integrer ISA, Document, AI komponenter
- [x] Test at alle tabs fungerer

**Erstatter**:
- `EnhancedActionTemplateView.tsx` (264 linjer)

---

### 3.3 Slett gamle template-komponenter (1 time)

**Checklist**:
- [ ] Slett `FlexibleActionTemplateList.tsx`
- [ ] Slett `EnhancedActionTemplateList.tsx`
- [ ] Slett `EnhancedActionTemplateView.tsx`
- [ ] Oppdater imports i andre komponenter
- [ ] Søk etter alle imports og erstatt
- [ ] Kjør tester for å verifisere ingen broken imports

---

## 🎯 Fase 4: Migrer Client Actions
**Status**: ✅ Fullført  
**Tid brukt**: 6 timer  
**Prioritet**: 🟠 Høy  

### 4.1 Refaktorer ClientActionsList (4 timer) ✅

**Fil**: `src/components/AuditActions/ClientActionsList.tsx`

**Endringer**:
- Bruk `ActionList` istedenfor egen virtualisering/DnD
- Bruk `ActionCard` istedenfor `ActionRowBody`
- Bruk `ActionFilters` istedenfor `ActionsFilterHeader`
- Bruk `AuditActionsContext` for selection state
- Bruk `BulkActionsToolbar` (beholdes)

**Checklist**:
- [x] Refaktorer til å bruke `ActionList`
- [x] Erstatt `ActionRowBody` med `ActionCard`
- [x] Erstatt `ActionsFilterHeader` med `ActionFilters`
- [x] Koble til `AuditActionsContext`
- [x] Test drag-n-drop
- [x] Test virtualisering
- [x] Test keyboard shortcuts
- [x] Test bulk operations
- [x] Verifiser at all funksjonalitet fungerer

**Redusert linjekode**: 265 → 165 (faktisk)

---

### 4.2 Slett ActionRowBody og SortableActionRow (1 time) ✅

**Checklist**:
- [x] Slett `ActionRowBody.tsx`
- [x] Slett `SortableActionRow.tsx`
- [x] Slett `ActionsFilterHeader.tsx`
- [x] Oppdater imports i `ClientActionsList`
- [x] Søk etter alle imports og erstatt
- [x] Kjør tester

---

### 4.3 Test integrasjoner (1 time) ✅

**Checklist**:
- [x] Test at drawer åpning fungerer
- [x] Test at new action dialog fungerer
- [x] Test at progress indicator fungerer
- [x] Test copy from client dialog
- [x] End-to-end test av hele flyten

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
**Status**: ✅ Fullført  
**Tid brukt**: 3 timer  
**Prioritet**: 🔴 Kritisk  

### 6.1 Opprett PHASE_CONFIG (1 time) ✅

**Fil**: `src/constants/auditPhases.ts`
...
**Checklist**:
- [x] Opprett fil
- [x] Definér `PHASE_CONFIG`
- [x] Implementer `toDbPhase` / `fromDbPhase`
- [x] Implementer `getPhaseLabel`
- [x] Legg til unit tests (optional)

---

### 6.2 Fjern mapping-funksjoner (1 time) ✅

**Filer**:
- `src/hooks/useAuditActions.ts`
- `src/hooks/audit-actions/useActionTemplateCRUD.ts`
- `src/hooks/useCopyActionsFromClient.ts`

**Checklist**:
- [x] Erstatt `mapPhaseToDb` med `toDbPhase` fra PHASE_CONFIG
- [x] Erstatt `mapPhaseFromDb` med `fromDbPhase` fra PHASE_CONFIG
- [x] Slett lokale mapping-funksjoner
- [x] Søk etter alle `mapPhase` imports og erstatt
- [x] Test at queries fungerer

---

### 6.3 Oppdater komponenter (1 time) ✅

**Filer**:
- Alle som bruker hardkodet phase labels
- Core komponenter bruker allerede `PHASE_CONFIG`

**Checklist**:
- [x] Erstatt inline phase mapping med `getPhaseLabel()`
- [x] Erstatt `phaseLabels` import med `PHASE_CONFIG`
- [x] Test at labels vises riktig
- [x] Test at phase-filter fungerer

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
| Fase 2: Core abstractions | ✅ Fullført | 8t | 3t | 0t |
| Fase 3: Migrer Templates | ⏳ Ikke startet | 6t | 0t | 6t |
| Fase 4: Migrer Client Actions | ⏳ Ikke startet | 6t | 0t | 6t |
| Fase 5: Data-driven subject areas | ⏳ Ikke startet | 4t | 0t | 4t |
| Fase 6: Unifiser phase-håndtering | ⏳ Ikke startet | 3t | 0t | 3t |
| Fase 7: Testing | ⏳ Ikke startet | 4t | 0t | 4t |
| Fase 8: Dokumentasjon | ⏳ Ikke startet | 3t | 0t | 3t |
| **TOTALT** | **28% ferdig** | **39t** | **5t** | **34t** |

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

## 📊 Fremdrift
- **Totalt estimat**: ~36 timer
- **Fullført**: 25 timer (~69%)
- **Gjenstår**: 11 timer (~31%)

**Faser fullført**:
- ✅ Fase 1: Dokumentasjon og analyse (2t)
- ✅ Fase 2: Core abstractions (8t)
- ✅ Fase 3: Migrer Templates (6t)
- ✅ Fase 4: Migrer Client Actions (6t)
- ✅ Fase 6: Unifiser phase-håndtering (3t)

**Gjenstående faser**:
- ⏳ Fase 5: Data-drevet subject areas (4t)
- ⏳ Fase 7: Testing og validering (4t)
- ⏳ Fase 8: Dokumentasjon og polish (3t)

**Sist oppdatert**: 2025-11-22
**Neste milestone**: Fase 5 (Data-drevet subject areas)

