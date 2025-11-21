# Revisjonshandlinger – Systemarkitektur

**Status:** Fase 1 dokumentasjon ferdigstilt  
**Dato:** 2025-11-21  
**Versjon:** 1.0

## 📋 Innholdsfortegnelse

1. [Oversikt](#oversikt)
2. [Database schema](#database-schema)
3. [Komponenthierarki](#komponenthierarki)
4. [Dataflyt og state management](#dataflyt-og-state-management)
5. [Identifiserte problemer](#identifiserte-problemer)
6. [Duplisert kode](#duplisert-kode)

---

## Oversikt

Revisjonshandlinger-systemet er bygget rundt to hovedkonsepter:
- **Templates (Maler)**: Gjenbrukbare handlingsmaler som brukes på tvers av klienter
- **Client Actions (Klienthandlinger)**: Konkrete revisjonshandlinger knyttet til en spesifikk klient

### Nøkkelkomponenter

```
AuditActionsManager (Hub)
├── ClientActionsList (Klienthandlinger)
│   ├── ActionRowBody
│   ├── SortableActionRow
│   ├── ActionDetailDrawer
│   ├── NewActionDialog
│   ├── BulkActionsToolbar
│   └── ActionsFilterHeader
│
└── FlexibleActionTemplateList (Maler)
    ├── EnhancedActionTemplateList
    │   └── EnhancedActionTemplateView
    │       ├── ActionISAStandards
    │       ├── ActionDocumentRequirements
    │       ├── ActionAIAssistant
    │       └── WorkingPaperTemplateManager
    │
    └── ActionTemplateList (wrapper)
```

---

## Database schema

### Hovedtabeller

#### `audit_action_templates`
Lagrer handlingsmaler som kan gjenbrukes på tvers av klienter.

**Nøkkelfelt:**
- `id` (PK)
- `name`, `description`, `objective`, `procedures`
- `subject_area` (enum: sales, payroll, operating_expenses, etc.)
- `action_type` (enum: analytical, substantive, control_test, etc.)
- `risk_level` (string: low, medium, high, critical)
- `applicable_phases` (array: engagement, planning, execution, conclusion)
- `estimated_hours` (numeric)
- `is_system_template` (boolean)
- `is_active` (boolean)
- `sort_order` (int)

#### `client_audit_actions`
Konkrete revisjonshandlinger for en spesifikk klient.

**Nøkkelfelt:**
- `id` (PK)
- `client_id` (FK → clients)
- `template_id` (FK → audit_action_templates, nullable)
- `assigned_to`, `reviewed_by` (FK → users)
- `subject_area`, `action_type`, `risk_level` (samme enum som templates)
- `phase` (enum: engagement, planning, execution, conclusion, reporting)
- `status` (enum: not_started, in_progress, completed, reviewed, approved)
- `name`, `description`, `objective`, `procedures`
- `findings`, `conclusion`, `work_notes`
- `due_date`, `completed_at`, `reviewed_at`
- `estimated_hours`, `actual_hours`
- `sort_order` (int - for drag-n-drop)
- `working_paper_template_id`, `working_paper_data`, `auto_metrics` (JSONB)
- `copied_from_client_id`, `copied_from_action_id` (for kopiering)

#### `action_groups`
Gruppering av handlingsmaler etter fagområde.

**Nøkkelfelt:**
- `id` (PK)
- `subject_area` (enum)
- `name`, `description`, `color`
- `is_system_group` (boolean)
- `sort_order` (int)

### Utvidede tabeller (Enhanced features)

#### `isa_standards`
ISA-standarder som kan knyttes til handlingsmaler.

#### `document_requirements`
Dokumentasjonskrav som kan knyttes til handlingsmaler.

#### `working_paper_templates`
Maler for arbeidspapirer.

#### `action_ai_metadata`
AI-metadata for handlingsmaler (specialized prompts, risk indicators, etc.)

#### Koblingstabler
- `audit_action_isa_mapping`: Kobler templates til ISA-standarder
- `audit_action_document_mapping`: Kobler templates til dokumentkrav

---

## Komponenthierarki

### 36 komponenter i `src/components/AuditActions/`

#### 🏠 **Hub-komponenter**
- `AuditActionsManager.tsx` - Hovedkomponent, koordinerer alle underelementer
- `AuditActionsTab.tsx` - Tab-interface for AI-verktøy, anbefalinger, testing

#### 📝 **Template-komponenter**
- `FlexibleActionTemplateList.tsx` - Wrapper med to visningsmoduser (basic/enhanced)
- `EnhancedActionTemplateList.tsx` - Utvidet visning med ISA, dokumenter, AI
- `EnhancedActionTemplateView.tsx` - Detaljert enkelmal-visning
- `ActionTemplateList.tsx` - Enkel wrapper som kaller FlexibleActionTemplateList
- `CreateActionTemplateDialog.tsx` - Dialog for å opprette ny mal
- `ImprovedCreateActionTemplateForm.tsx` - Forbedret skjema for mal-oppretting
- `CreateActionTemplateForm/index.tsx` - Modulær form-komponent (egen mappe)

#### 🎯 **Client Actions-komponenter**
- `ClientActionsList.tsx` - Liste over klienthandlinger med drag-n-drop, bulk, virtualisering
- `ActionRowBody.tsx` - Visning av en enkelt handling (deles av sortable/non-sortable)
- `SortableActionRow.tsx` - Wrapper for ActionRowBody med DnD-funksjonalitet
- `ActionDetailDrawer.tsx` - Side-drawer for redigering av handling
- `NewActionDialog.tsx` - Dialog for å opprette ny handling fra scratch
- `ActionProgressIndicator.tsx` - Progress bar for handlingsstatus

#### 🔧 **Hjelpkomponenter**
- `ActionsFilterHeader.tsx` - Søk, filter, "velg alle"-checkbox
- `BulkActionsToolbar.tsx` - Bulk-operasjoner (status, slett, etc.)
- `ActionStatusBadge.tsx` - Badge for status-visning
- `ActionQuickActions.tsx` - Dropdown med quick actions (start, fullført, etc.)
- `SubjectAreaNav.tsx` - Hierarkisk navigasjon i fagområder
- `ActionDrawerHeader.tsx` - Header for ActionDetailDrawer
- `ActionDrawerFooter.tsx` - Footer med Lagre/Avbryt-knapper
- `ActionDetailsForm.tsx` - Skjema for basis detaljer (navn, beskrivelse, etc.)
- `TemplateSelector.tsx` - Dropdown for valg av working paper template
- `JsonEditor.tsx` - JSON-editor for working_paper_data
- `AutoMetricsViewer.tsx` - Read-only visning av auto_metrics

#### 🤖 **AI-komponenter**
- `SmartActionRecommendations.tsx` - AI-genererte handlingsforslag
- `AIEnabledActionEditor.tsx` - Editor med AI-assistanse
- `ActionAIAssistant.tsx` - AI-assistent for en spesifikk mal
- `SpecializedAIAssistant.tsx` - Spesialisert AI for spesifikke oppgaver
- `AIPreviewDialog.tsx` - Preview av AI-generert innhold

#### 📄 **Working Papers & Dokumenter**
- `WorkingPaperTemplateManager.tsx` - Håndtering av arbeidspapirmaler
- `WorkingPaperGenerator.tsx` - Generering av arbeidspapirer
- `ActionISAStandards.tsx` - Visning/håndtering av ISA-koblinger
- `ActionDocumentRequirements.tsx` - Visning/håndtering av dokumentkrav

#### 🗂️ **Dialogs & Utility**
- `CopyFromClientDialog.tsx` - Dialog for å kopiere handlinger fra annen klient
- `VersionHistory.tsx` - Historikk for endringer
- `VersionDiffDialog.tsx` - Dialog for å sammenligne versjoner
- `VersionDiffViewer.tsx` - Viewer for diffs
- `AuditActionsFlowTester.tsx` - Testing av hele flyten

---

## Dataflyt og state management

### React Query Keys

```typescript
// Templates
['audit-action-templates']
['audit-action-templates', subjectArea]
['enhanced-audit-action-templates']
['action-template', templateId]

// Client Actions
['client-audit-actions', clientId]
['client-audit-actions', clientId, phase]
['client-audit-action', actionId]

// Enhanced features
['action-isa-mappings', templateId]
['action-document-mappings', templateId]
['action-ai-metadata', templateId]
['working-paper-templates', subjectArea, actionType]

// Recommendations
['audit-action-recommendations', clientId]
['client-risk-assessments', clientId]
```

### Hooks (4 filer i `src/hooks/audit-actions/`)

#### `useActionTemplateCRUD.ts`
Eksporterer:
- `useAuditActionTemplates(subjectArea?)`
- `useCreateAuditActionTemplate()`
- `useUpdateAuditActionTemplate()`
- `useDeleteAuditActionTemplate()`

**Problem**: Inneholder egen `mapPhaseFromDb` som ikke er synkronisert med `useAuditActions.ts`

#### `useClientActionBulk.ts`
Eksporterer:
- `useReorderClientAuditActions()` - Bulk reorder
- `useBulkUpdateClientActionsStatus()` - Bulk status update
- `useBulkDeleteClientActions()` - Bulk delete

#### `useTemplateFilters.ts`
Custom hook for filtrering av templates:
- Søk (name, description, procedures)
- Risikonivå
- Fase
- AI-metadata (optional)

#### `useImprovedAuditActions.ts`
Re-eksporterer hooks fra `useActionTemplateCRUD.ts` med "Improved"-prefikser.

### Andre relevante hooks

I `src/hooks/`:
- `useAuditActions.ts` - Hovedhook med `mapPhaseToDb/mapPhaseFromDb`
- `useEnhancedAuditActions.ts` - Enhanced features (ISA, dokumenter, AI)
- `useAuditActionLibrary.ts` - Recommendations og risk assessments
- `useCopyActionsFromClient.ts` - Kopiering fra annen klient
- `useCompleteAction.ts` - Fullføre handling med auto-metrics
- `useStartTimeTracking.ts` - Start tidssporing

---

## Identifiserte problemer

### 🔴 Kritisk

#### 1. Phase-mapping kaos
**Problem**: Tre separate implementasjoner av fase-mapping:
- `useAuditActions.ts`: `mapPhaseToDb()` / `mapPhaseFromDb()`
- `useActionTemplateCRUD.ts`: `mapPhaseFromDb()` (lokal)
- Flere steder: Hardkodet mapping i komponenter

**Inkonsistenser**:
```typescript
// useAuditActions.ts
completion → conclusion (DB)
risk_assessment → planning (DB)

// Database enum: engagement | planning | execution | conclusion | reporting
// UI enum: engagement | planning | risk_assessment | execution | completion

// PROBLEM: 'completion' og 'conclusion' brukes om hverandre
// PROBLEM: 'risk_assessment' mappes til 'planning'
```

**Påvirkning**: 
- Filter på fase fungerer ikke konsistent
- Handlinger vises i feil fase-tab
- Templates kopieres med feil fase

#### 2. Duplisert liste-logikk
**Problem**: Tre separate liste-komponenter:
- `FlexibleActionTemplateList.tsx` (278 linjer)
- `EnhancedActionTemplateList.tsx` (156 linjer)  
- `ClientActionsList.tsx` (265 linjer)

**Duplikat funksjonalitet**:
- Søk og filtrering
- Checkbox-håndtering
- Badge-rendering (`getRiskBadgeColor`, `getSubjectAreaName`)
- Skeleton states
- Empty states

#### 3. Subject Area hardkodet type
**Problem**: `AuditSubjectArea` er en hardkodet TypeScript enum istedenfor å bruke `subject_areas`-tabellen.

**Fil**: `src/types/audit-actions.ts`
```typescript
export type AuditSubjectArea = 
  | 'sales'
  | 'payroll'
  | 'operating_expenses'
  // ... 12 totalt
```

**Konsekvenser**:
- Må endre type-definisjonen for å legge til nytt fagområde
- Kan ikke ha dynamiske fagområder per revisjonsfirma
- `SUBJECT_AREA_LABELS` må oppdateres manuelt

### 🟠 Medium prioritet

#### 4. Manglende abstraksjon for ActionCard
Samme card-layout gjentas i:
- `FlexibleActionTemplateList.tsx` (lines 191-269)
- `EnhancedActionTemplateView.tsx` (lines 58-136)
- `ActionRowBody.tsx` (lines 19-64)

**Duplisert logikk** (~80 linjer total):
- Badge-rendering
- Status icons
- Quick actions placement
- Responsive layout

#### 5. State management er fragmentert
**Problem**: Ingen felles state/context.

**Konsekvenser**:
- Hver komponent holder sin egen `selectedIds`-state
- Bulk-operasjoner kan ikke koordineres på tvers
- Ingen felles undo/redo stack
- Vanskelig å implementere globale features (f.eks. "recent actions")

#### 6. Filter-state er duplisert
`useTemplateFilters` hook kun for templates, men samme logikk trengs for:
- Client actions
- Recommendations
- Working papers

Hver komponent implementerer egen filter-state.

### 🟡 Lav prioritet

#### 7. Virtualisering kun for client actions
`ClientActionsList` bruker `@tanstack/react-virtual`, men:
- `FlexibleActionTemplateList` rendrer alle templates (potensielt 100+)
- `EnhancedActionTemplateList` har ingen virtualisering

#### 8. Inkonsistent error handling
- Noen komponenter bruker `toast()` fra `sonner`
- Andre bruker `useToast()` fra `@/hooks/use-toast`
- Noen logger kun til console

---

## Duplisert kode

### Kategori 1: Badge og styling-logikk

#### `getRiskBadgeColor()`
**Duplikater**: 3 steder
- `FlexibleActionTemplateList.tsx` (lines 62-69)
- `EnhancedActionTemplateView.tsx` (lines 30-37)
- Implisitt i `ActionStatusBadge.tsx` (lines 11-42)

```typescript
// Identisk implementasjon 3 steder:
const getRiskBadgeColor = (riskLevel: string) => {
  switch (riskLevel) {
    case 'high': return 'destructive';
    case 'medium': return 'default';
    case 'low': return 'secondary';
    default: return 'outline';
  }
};
```

#### `getSubjectAreaName()`
**Duplikater**: 2 steder
- `FlexibleActionTemplateList.tsx` (lines 71-74)
- `AuditActionsManager.tsx` (implisitt, bruker `SUBJECT_AREA_LABELS`)

```typescript
const getSubjectAreaName = (areaKey: string) => {
  const area = subjectAreas?.find(a => a.name === areaKey);
  return area?.display_name || areaKey;
};
```

### Kategori 2: Phase label mapping

**Duplikater**: 4+ steder
- `FlexibleActionTemplateList.tsx` (lines 242-246)
- `EnhancedActionTemplateView.tsx` (lines 175-178)
- `ActionRowBody.tsx` (line 44)
- `phaseLabels` import brukes 12+ steder

```typescript
// Hardkodet mapping gjentas:
phase === 'engagement' ? 'Engasjement' :
phase === 'planning' ? 'Planlegging' : 
phase === 'execution' ? 'Utførelse' : 
phase === 'completion' ? 'Avslutning' : phase
```

### Kategori 3: Filter og søk-logikk

#### Search term filtering
**Duplikater**: 4 steder
- `FlexibleActionTemplateList.tsx` (via `useTemplateFilters`)
- `ClientActionsList.tsx` (lines 45-52, inline)
- `EnhancedActionTemplateList.tsx` (via `useTemplateFilters`)
- `SmartActionRecommendations.tsx` (implisitt)

```typescript
// Samme pattern 4 steder:
const filteredItems = items.filter(item => {
  const term = searchTerm.toLowerCase();
  return item.name.toLowerCase().includes(term) || 
         item.description?.toLowerCase().includes(term);
});
```

### Kategori 4: Empty state rendering

**Duplikater**: 6 steder
- `FlexibleActionTemplateList.tsx` (lines 175-188)
- `ClientActionsList.tsx` (lines 174-191)
- `EnhancedActionTemplateList.tsx` (implisitt)
- `SmartActionRecommendations.tsx` (lines 279-291)
- Andre...

```tsx
// Identisk struktur:
{filteredItems.length === 0 ? (
  <Card>
    <CardContent className="p-6 text-center text-gray-500">
      <p className="mb-4">Ingen [items] funnet</p>
      <Button onClick={...}>Opprett første [item]</Button>
    </CardContent>
  </Card>
) : (
  // ... render items
)}
```

### Kategori 5: Checkbox selection-state

**Duplikater**: 3 steder
- `FlexibleActionTemplateList.tsx` (lines 47-60)
- `ClientActionsList.tsx` (lines 82-87)
- Alle bruker samme pattern men ingen delt abstraksjon

```typescript
// Identisk state management:
const [selectedIds, setSelectedIds] = useState<string[]>([]);

const toggleSelect = (id: string) => {
  setSelectedIds(prev => 
    prev.includes(id) 
      ? prev.filter(x => x !== id) 
      : [...prev, id]
  );
};
```

### Kategori 6: Status-relatert logikk

#### Status labels og icons
**Duplikater**: 3 steder
- `ActionStatusBadge.tsx` (lines 11-42)
- `BulkActionsToolbar.tsx` (implisitt i buttons)
- `ActionQuickActions.tsx` (lines 61-99)

```typescript
// statusConfig gjentas:
const statusConfig = {
  not_started: { label: 'Ikke startet', icon: Pause },
  in_progress: { label: 'Pågående', icon: Play },
  completed: { label: 'Fullført', icon: CheckCircle },
  // ...
};
```

---

## Oppsummering av duplisering

| Type duplikasjon | Antall steder | Estimert linjer | Prioritet |
|-----------------|---------------|-----------------|-----------|
| Badge/styling logikk | 6+ | ~120 | Høy |
| Phase mapping | 12+ | ~80 | Kritisk |
| Filter/søk | 4+ | ~100 | Høy |
| Empty states | 6+ | ~150 | Medium |
| Selection state | 3 | ~60 | Medium |
| Status config | 3 | ~90 | Medium |
| **TOTALT** | **34+** | **~600** | - |

---

## Neste steg

Se [migration-checklist.md](./migration-checklist.md) for detaljert plan.

**Prioritert rekkefølge**:
1. Fase 2: Core abstractions (ActionCard, ActionList, filters)
2. Fase 6: Unifiser phase-håndtering
3. Fase 5: Data-driven subject areas
4. Fase 3-4: Migrer templates og client actions
5. Fase 7-8: Testing og dokumentasjon
