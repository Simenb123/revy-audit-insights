# Komponentkart – Revisjonshandlinger

Dette dokumentet gir en visuell oversikt over alle komponenter i revisjonshandlinger-systemet, deres ansvar og avhengigheter.

## 📊 Komponent-oversikt

### Fordeling etter kategori

```
📁 src/components/AuditActions/ (32 komponenter) ✅ Refaktorert

├── 🏠 Hub (2)
│   ├── AuditActionsManager
│   └── AuditActionsTab
│
├── ⚡ Core (4) ✨ Nye
│   ├── ActionCard ⭐ (Universal card)
│   ├── ActionList ⭐ (Virtualisert liste)
│   ├── ActionFilters ⭐ (Universal filter UI)
│   └── badgeUtils ⭐ (Felles badge utilities)
│
├── 📝 Templates (6)
│   ├── TemplateLibrary ✨ (Erstatter Flexible+Enhanced)
│   ├── EnhancedTemplateView
│   ├── ActionTemplateList (wrapper til TemplateLibrary)
│   ├── CreateActionTemplateDialog
│   ├── ImprovedCreateActionTemplateForm
│   └── CreateActionTemplateForm/ (mappe)
│
├── 🎯 Client Actions (4)
│   ├── ClientActionsList ⭐ (Refaktorert)
│   ├── ActionDetailDrawer
│   ├── NewActionDialog
│   └── ActionProgressIndicator
│
├── 🔧 Utility (8)
│   ├── BulkActionsToolbar
│   ├── ActionStatusBadge
│   ├── ActionQuickActions
│   ├── SubjectAreaNav
│   ├── ActionDrawerHeader
│   ├── ActionDrawerFooter
│   ├── ActionDetailsForm
│   ├── TemplateSelector
│   ├── JsonEditor
│   └── AutoMetricsViewer
│
├── 🤖 AI (5)
│   ├── SmartActionRecommendations
│   ├── AIEnabledActionEditor
│   ├── ActionAIAssistant
│   ├── SpecializedAIAssistant
│   └── AIPreviewDialog
│
├── 📄 Working Papers (4)
│   ├── WorkingPaperTemplateManager
│   ├── WorkingPaperGenerator
│   ├── ActionISAStandards
│   └── ActionDocumentRequirements
│
├── 🗂️ Dialogs (4)
│   ├── CopyFromClientDialog
│   ├── VersionHistory
│   ├── VersionDiffDialog
│   └── VersionDiffViewer
│
└── 🧪 Testing (1)
    └── AuditActionsFlowTester

✨ = Nye komponenter etter refaktorering
⭐ = Kritisk komponent
✅ = Refaktorert og testet

**Slettet etter refaktorering** (699 linjer):
- FlexibleActionTemplateList (278 linjer)
- EnhancedActionTemplateList (157 linjer)
- ActionRowBody (68 linjer)
- SortableActionRow (40 linjer)
- ActionsFilterHeader (156 linjer)
```

---

## 🏠 Hub-komponenter

### AuditActionsManager.tsx
**Rolle**: Hovedkoordinator for alle revisjonshandlinger-funksjoner på klient-side.

**Ansvar**:
- Vise progress-indikator
- Bytte mellom "Klienthandlinger" og "Handlingsmaler" tabs
- Håndtere "Kopier fra annen klient"-dialog
- Koordinere `onCopyToClient` callbacks

**Children**:
- `ClientActionsList`
- `FlexibleActionTemplateList` (via `ActionTemplateList`)
- `ActionProgressIndicator`
- `CopyFromClientDialog`

**Props**:
```typescript
interface Props {
  clientId: string;
  phase?: string;
}
```

**State**:
- `[showDialog, setShowDialog]` - CopyFromClient dialog
- `[activeTab, setActiveTab]` - 'actions' | 'templates'
- `[dismissedHelp, setDismissedHelp]` - Dismissed help alerts

**Data dependencies**:
- `useAuditActionTemplates()`
- `useClientAuditActions(clientId, phase)`
- `useCreateStandardActionPackage()`

**Filer som bruker den**: `ClientDetails.tsx`, routing

---

### AuditActionsTab.tsx
**Rolle**: Tab-interface for AI-funksjoner og testing.

**Ansvar**:
- 5 tabs: Oversikt, AI-forslag, AI-verktøy, Dokumenter, Testing
- SEO metadata
- Koordinere AI-komponenter

**Children**:
- `AuditActionsManager` (Oversikt tab)
- `SmartActionRecommendations` (AI-forslag tab)
- `AIEnabledActionEditor` (AI-verktøy tab)
- `IntelligentDocumentLinker` (Dokumenter tab)
- `AuditActionsFlowTester` (Testing tab)

**Props**:
```typescript
interface Props {
  clientId: string;
  phase?: string;
}
```

**Filer som bruker den**: `ClientDetails.tsx`

---

## ⚡ Core komponenter

### ActionCard.tsx ⭐
**Rolle**: Universal card layout for både templates og client actions.

**Ansvar**:
- Render badges (risk, status, phase, action type)
- Multi-select checkbox support
- Quick actions placement
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

**Brukes av**: `TemplateLibrary`, `ClientActionsList`

**Linjer**: ~120

---

### ActionList.tsx ⭐
**Rolle**: Virtualisert liste med multi-select og drag-n-drop.

**Ansvar**:
- Virtualisering med `@tanstack/react-virtual`
- Drag-n-drop med `@dnd-kit` (optional)
- Keyboard shortcuts (Ctrl+A, Shift+Click, Esc)
- Empty state rendering

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

**Brukes av**: `TemplateLibrary`, `ClientActionsList`

**Linjer**: ~180

---

### ActionFilters.tsx ⭐
**Rolle**: Universal filter UI for templates og client actions.

**Ansvar**:
- Search input
- Risk, phase, status, AI filters
- "Select all visible" checkbox
- Result count display

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
```

**Brukes av**: `TemplateLibrary`, `ClientActionsList`

**Linjer**: ~95

---

### badgeUtils.ts ⭐
**Rolle**: Felles utility-funksjoner for badge styling.

**Funksjoner**:
- `getBadgeVariant(type: string): BadgeVariant`
- `getBadgeLabel(type: string): string`
- `getRiskBadgeColor(level: RiskLevel): string`
- `getStatusBadgeColor(status: ActionStatus): string`

**Brukes av**: `ActionCard`, `EnhancedTemplateView`, andre komponenter

**Linjer**: ~80

---

## 📝 Template-komponenter

### TemplateLibrary.tsx ✨
**Rolle**: Erstatter FlexibleActionTemplateList og EnhancedActionTemplateList.

**Ansvar**:
- Toggle mellom 'basic' og 'enhanced' view
- Håndtere søk og filter
- Multi-select og bulk "copy to client"
- Bruk core komponenter (ActionCard, ActionList, ActionFilters)

**Children**:
- `ActionList` → `ActionCard` (basic mode)
- `EnhancedTemplateView` (enhanced mode)
- `CreateActionTemplateDialog`

**Props**:
```typescript
interface Props {
  phase?: string;
  onCopyToClient?: (templateIds: string[]) => void;
  onEditTemplate?: (template: AuditActionTemplate) => void;
}
```

**Data dependencies**:
- `useAuditActionTemplates()` (basic mode)
- `useEnhancedAuditActionTemplates()` (enhanced mode)

**Linjer**: ~200 (reduksjon fra 435 linjer i gamle komponenter)

---

### EnhancedTemplateView.tsx
**Rolle**: Detaljert visning av én template med tabs (refaktorert).

**Ansvar**:
- 5 tabs: Oversikt, ISA-standarder, Dokumenter, Arbeidspapirer, AI
- Badge-rendering via `badgeUtils`
- Phase labels via `getPhaseLabel()` fra PHASE_CONFIG
- "Bruk i revisjon"-knapp

**Children**:
- `ActionISAStandards`
- `ActionDocumentRequirements`
- `WorkingPaperTemplateManager`
- `ActionAIAssistant`
- `WorkingPaperGenerator` (dialog)

**Props**:
```typescript
interface Props {
  template: EnhancedAuditActionTemplate;
  onCopyToClient?: (templateId: string) => void;
  onEditTemplate?: (template: EnhancedAuditActionTemplate) => void;
}
```

**State**:
- `[activeTab, setActiveTab]`
- `[selectedWorkingPaperTemplate, setSelectedWorkingPaperTemplate]`
- `[showWorkingPaperGenerator, setShowWorkingPaperGenerator]`

**Linjer**: 263 (ingen duplisert logikk etter refaktorering)

---

### ActionTemplateList.tsx
**Rolle**: Thin wrapper som forwader props til `TemplateLibrary`.

**Ansvar**: Backward compatibility wrapper

**Props**: Forwader til `TemplateLibrary`

**Linjer**: 28

---

### CreateActionTemplateDialog.tsx
**Rolle**: Dialog for å opprette ny handlingsmal.

**Ansvar**:
- Render dialog med trigger button
- Inneholder `ImprovedCreateActionTemplateForm`

**Children**:
- `ImprovedCreateActionTemplateForm`

**Props**:
```typescript
interface Props {
  trigger?: React.ReactNode;
  selectedArea?: AuditSubjectArea;
  onSuccess?: () => void;
}
```

---

### ImprovedCreateActionTemplateForm.tsx
**Rolle**: Skjema for å opprette action template.

**Ansvar**:
- React Hook Form med Zod validation
- Submit til `useCreateAuditActionTemplate()`

**Children**:
- `BasicFields`, `DetailFields`, `PhaseSelection` (fra CreateActionTemplateForm/)

**Form fields**:
- name, description, subject_area, action_type
- objective, procedures, documentation_requirements
- estimated_hours, risk_level, applicable_phases, sort_order

**Linjer**: 114

---

### CreateActionTemplateForm/
**Rolle**: Modular form med separate sub-komponenter.

**Filer**:
- `index.tsx` - Main form
- `BasicFields.tsx` - Navn, beskrivelse, fagområde
- `DetailFields.tsx` - Prosedyrer, dokumentasjonskrav, estimert tid
- `PhaseSelection.tsx` - Multi-select for applicable_phases

---

## 🎯 Client Actions-komponenter

### ClientActionsList.tsx ⭐
**Rolle**: Hovedkomponent for liste over klienthandlinger (refaktorert).

**Ansvar**:
- Drag-n-drop reorder (via `@dnd-kit`)
- Virtualisering (via ActionList core component)
- Multi-select med keyboard shortcuts
- Bulk-operasjoner via AuditActionsContext
- Filter og søk

**Children**:
- `ActionProgressIndicator`
- `ActionFilters` (erstatter ActionsFilterHeader)
- `BulkActionsToolbar`
- `ActionList` → `ActionCard` (erstatter ActionRowBody)
- `ActionDetailDrawer`
- `NewActionDialog`

**Props**:
```typescript
interface Props {
  actions: ClientAuditAction[];
  clientId: string;
  phase: AuditPhase;
  onOpenTemplates?: () => void;
}
```

**State** (via AuditActionsContext):
- `selectedIds`, `toggleSelect`, `selectAll`, `clearSelection`
- `bulkUpdateStatus`, `bulkDelete`

**Keyboard shortcuts**:
- `Ctrl/Cmd+A` - Select all visible
- `Delete` - Delete selected
- `1-5` - Set status
- `R` - Set status "reviewed"
- `G` - Set status "approved"
- `Esc` - Clear selection

**Data dependencies**:
- `useReorderClientAuditActions()`
- `useBulkUpdateClientActionsStatus()`
- `useBulkDeleteClientActions()`

**Linjer**: ~165 (redusert fra 265 linjer)

---

### ActionDetailDrawer.tsx
**Rolle**: Side-drawer for å redigere en klienthandling.

**Ansvar**:
- Form for alle felter på ClientAuditAction
- Håndtere working paper data (JSON)
- Vise relatert template info (ISA, dokumenter, AI)
- Integrasjon med working paper templates

**Children**:
- `ActionDrawerHeader`
- `ActionDrawerFooter`
- `ActionDetailsForm`
- `TemplateSelector`
- `JsonEditor`
- `AutoMetricsViewer`
- `EnhancedActionTemplateView` (dialog)

**Props**:
```typescript
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: ClientAuditAction | null;
}
```

**State**:
- Form fields (name, description, procedures, dueDate, workNotes)
- `[wpJson, setWpJson]` - Working paper JSON
- `[jsonError, setJsonError]`
- `[showJson, setShowJson]`
- `[selectedTemplateId, setSelectedTemplateId]`
- `[phase, setPhase]`
- `[showTemplate, setShowTemplate]`

**Data dependencies**:
- `useUpdateClientAuditAction()`
- `useWorkingPaperTemplates()`
- `useActionISAMappings()`
- `useActionDocumentMappings()`
- `useActionAIMetadata()`

**Linjer**: 286

---

### NewActionDialog.tsx
**Rolle**: Dialog for å opprette ny klienthandling fra scratch.

**Ansvar**:
- Form med React Hook Form
- Submit til `useCreateClientAuditAction()`
- "Opprett og åpne" eller "Opprett" (to knapper)

**Props**:
```typescript
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  selectedArea?: AuditSubjectArea | string;
  phase: AuditPhase | string;
  nextSortOrder: number;
  onCreated?: (action: ClientAuditAction) => void;
}
```

**Form fields**:
- name, action_type, risk_level
- due_date, estimated_hours
- description, procedures

**Linjer**: 197

---

### ActionProgressIndicator.tsx
**Rolle**: Progress bar med status-breakdown.

**Ansvar**:
- Kalkuler prosent fullført
- Vise antall per status
- Fargekodede segmenter

**Props**:
```typescript
interface Props {
  actions: ClientAuditAction[];
}
```

**Logikk**:
- Teller actions per status
- Beregner `completionRate = (completed + reviewed + approved) / total * 100`

---

## 🔧 Utility-komponenter

### ActionsFilterHeader.tsx
**Rolle**: Felles header for filter og søk.

**Ansvar**:
- Search input
- Status dropdown
- "Velg alle synlige"-checkbox

**Props**:
```typescript
interface Props {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  statusOptions: { value: string; label: string }[];
  allVisibleSelected: boolean;
  onToggleSelectAllVisible: () => void;
}
```

**Linjer**: 60

---

### BulkActionsToolbar.tsx
**Rolle**: Toolbar for bulk-operasjoner på valgte handlinger.

**Ansvar**:
- Vise antall valgte
- Knapper for status-endring
- Slett-knapp med confirm dialog
- "Fjern valg"-knapp

**Props**:
```typescript
interface Props {
  selectedCount: number;
  disabled?: boolean;
  onStatus: (status: BulkStatus) => void;
  onDeleteConfirm: () => void;
  onClear: () => void;
  confirmOpen: boolean;
  setConfirmOpen: (open: boolean) => void;
}
```

**⚠️ Duplisert logikk**:
- Status labels og icons - samme som ActionStatusBadge

**Linjer**: 135

---

### ActionStatusBadge.tsx ⚠️
**Rolle**: Badge for å vise status med icon.

**Ansvar**:
- Render badge med riktig variant og icon
- `statusConfig` map

**Props**:
```typescript
interface Props {
  status: string;
  size?: 'sm' | 'md';
}
```

**⚠️ Duplisert logikk**:
- statusConfig (11-42) - gjentas i ActionQuickActions og BulkActionsToolbar

**Linjer**: 55

---

### ActionQuickActions.tsx
**Rolle**: Dropdown med quick actions for en handling.

**Ansvar**:
- Kontekst-sensitiv meny basert på status
- Integrasjon med time tracking og completion hooks

**Props**:
```typescript
interface Props {
  action: ClientAuditAction;
  onEdit?: () => void;
}
```

**Dropdown items** (avhenger av status):
- `not_started` → "Start arbeid"
- `in_progress` → "Marker som fullført" | "Stopp arbeid"
- `completed` → "Send til gjennomgang" | "Gjenåpne"
- `reviewed` → "Godkjenn"
- Always: "Rediger detaljer"

**Data dependencies**:
- `useUpdateClientAuditAction()`
- `useStartTimeTracking()`
- `useCompleteAction()`

**Linjer**: 110

---

### SubjectAreaNav.tsx
**Rolle**: Hierarkisk navigasjon i fagområder.

**Ansvar**:
- Render hierarkisk tre med expand/collapse
- Vise antall handlinger per fagområde
- Fargekoding basert på `subject_areas.color`

**Props**:
```typescript
interface Props {
  selectedArea: string;
  onAreaSelect: (area: string) => void;
  actionCounts?: Record<string, number>;
}
```

**Data dependencies**:
- `useSubjectAreasHierarchical()`

**Linjer**: 142

---

### ActionDrawerHeader.tsx
**Rolle**: Header for ActionDetailDrawer.

**Ansvar**:
- Vise title og subtitle
- Vise action metadata (status, due date, etc.)

**Props**:
```typescript
interface Props {
  action: ClientAuditAction | null;
  title: string;
  subtitle: string;
}
```

**Linjer**: ~40 (estimert)

---

### ActionDrawerFooter.tsx
**Rolle**: Footer med Lagre/Avbryt-knapper.

**Props**:
```typescript
interface Props {
  onCancel: () => void;
  onSave: () => void;
  isSaving: boolean;
}
```

**Linjer**: 20

---

### ActionDetailsForm.tsx
**Rolle**: Form fields for basis detaljer.

**Ansvar**:
- Render inputs for name, description, procedures, due date, work notes
- Ingen egen state (controlled av parent)

**Props**:
```typescript
interface Props {
  name: string;
  description: string;
  procedures: string;
  dueDate?: string;
  workNotes: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onProceduresChange: (value: string) => void;
  onDueDateChange: (value: string | undefined) => void;
  onWorkNotesChange: (value: string) => void;
}
```

**Linjer**: ~80 (estimert)

---

### TemplateSelector.tsx
**Rolle**: Dropdown for valg av working paper template.

**Props**:
```typescript
interface Props {
  templates: WorkingPaperTemplate[];
  value?: string;
  onChange: (value: string) => void;
  onTemplateSelected?: (template: WorkingPaperTemplate) => void;
}
```

**Linjer**: ~50 (estimert)

---

### JsonEditor.tsx
**Rolle**: JSON-editor for working_paper_data.

**Ansvar**:
- Textarea med syntax highlighting (optional)
- Validering og error display

**Props**:
```typescript
interface Props {
  value: string;
  error: string | null;
  show: boolean;
  onToggleShow: () => void;
  onChange: (value: string) => void;
}
```

**Linjer**: ~60 (estimert)

---

### AutoMetricsViewer.tsx
**Rolle**: Read-only visning av auto_metrics.

**Ansvar**:
- Pretty-print JSON
- Scrollable container

**Props**:
```typescript
interface Props {
  metrics: any;
}
```

**Linjer**: 19

---

## 🤖 AI-komponenter

### SmartActionRecommendations.tsx
**Rolle**: Vise og håndtere AI-genererte handlingsforslag.

**Ansvar**:
- Vise pending og processed recommendations
- Aksepter/avvis-funksjonalitet
- Koble til risk assessments
- Details dialog

**Props**:
```typescript
interface Props {
  clientId: string;
  phase?: string;
}
```

**State**:
- `[selectedRecommendation, setSelectedRecommendation]`
- `[showDetailsDialog, setShowDetailsDialog]`
- `[customNotes, setCustomNotes]`

**Data dependencies**:
- `useAuditActionRecommendations(clientId)`
- `useClientRiskAssessments(clientId)`
- `useUpdateRecommendationStatus()`
- `useCopyActionsFromTemplate()`

**Linjer**: 340

---

### AIEnabledActionEditor.tsx
**Rolle**: Editor med AI-assistanse.

**Ansvar**:
- AI-generering av handlinger
- Kontekst-baserte forslag

**Linjer**: (Ikke lest i detalj)

---

### ActionAIAssistant.tsx
**Rolle**: AI-assistent for en spesifikk mal.

**Ansvar**:
- Vise AI metadata
- Specialized prompts
- Common issues, typical documents, risk indicators

**Props**:
```typescript
interface Props {
  actionTemplateId: string;
  metadata?: ActionAIMetadata;
  actionTemplate: EnhancedAuditActionTemplate;
}
```

**Linjer**: (Ikke lest i detalj)

---

### SpecializedAIAssistant.tsx
**Rolle**: Spesialisert AI for spesifikke oppgaver.

**Linjer**: (Ikke lest i detalj)

---

### AIPreviewDialog.tsx
**Rolle**: Preview av AI-generert innhold.

**Linjer**: (Ikke lest i detalj)

---

## 📄 Working Papers & Dokumenter

### WorkingPaperTemplateManager.tsx
**Rolle**: Håndtering av arbeidspapirmaler.

**Ansvar**:
- Liste tilgjengelige templates
- Select og apply template

**Props**:
```typescript
interface Props {
  selectedSubjectArea: string;
  actionType: string;
  onTemplateSelect: (template: WorkingPaperTemplate) => void;
}
```

**Linjer**: (Ikke lest i detalj)

---

### WorkingPaperGenerator.tsx
**Rolle**: Generering av arbeidspapirer.

**Ansvar**:
- Fylle ut template structure
- Lagre working_paper_data

**Props**:
```typescript
interface Props {
  template: WorkingPaperTemplate;
  actionTemplate: EnhancedAuditActionTemplate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (workingPaper: any) => void;
}
```

**Linjer**: (Ikke lest i detalj)

---

### ActionISAStandards.tsx
**Rolle**: Visning/håndtering av ISA-koblinger.

**Props**:
```typescript
interface Props {
  actionTemplateId: string;
  mappings: AuditActionISAMapping[];
}
```

**Linjer**: (Ikke lest i detalj)

---

### ActionDocumentRequirements.tsx
**Rolle**: Visning/håndtering av dokumentkrav.

**Props**:
```typescript
interface Props {
  actionTemplateId: string;
  mappings: AuditActionDocumentMapping[];
}
```

**Linjer**: (Ikke lest i detalj)

---

## 🗂️ Dialogs & Utility

### CopyFromClientDialog.tsx
**Rolle**: Dialog for å kopiere handlinger fra annen klient.

**Ansvar**:
- Liste alle klienter
- Hente handlinger fra valgt klient
- Multi-select og kopier

**Props**:
```typescript
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetClientId: string;
  phase: AuditPhase;
}
```

**Data dependencies**:
- `useClients()`
- `useClientAuditActions(sourceClientId)`
- `useCopyActionsFromClient()`

**Linjer**: (Ikke lest i detalj)

---

### VersionHistory.tsx
**Rolle**: Historikk for endringer på handlinger.

**Linjer**: (Ikke lest i detalj)

---

### VersionDiffDialog.tsx
**Rolle**: Dialog for å sammenligne versjoner.

**Linjer**: (Ikke lest i detalj)

---

### VersionDiffViewer.tsx
**Rolle**: Viewer for diffs.

**Linjer**: (Ikke lest i detalj)

---

### AuditActionsFlowTester.tsx
**Rolle**: Testing av hele flyten.

**Ansvar**:
- Simulere en komplett revisjonsprosess
- Verifisere at alle integrasjoner fungerer

**Linjer**: (Ikke lest i detalj)

---

## 📊 Oppsummering

| Kategori | Antall | Totalt (estimert linjer) |
|----------|--------|--------------------------|
| Hub | 2 | ~500 |
| Templates | 9 | ~1200 |
| Client Actions | 6 | ~1100 |
| Utility | 10 | ~800 |
| AI | 5 | ~800 |
| Working Papers | 4 | ~600 |
| Dialogs | 4 | ~500 |
| **TOTALT** | **40** | **~5500** |

**Nøkkelstatistikk**:
- 🎯 Mest kritisk: `ClientActionsList` (265 linjer), `ActionDetailDrawer` (286 linjer)
- ⚠️ Mest duplikat: `FlexibleActionTemplateList` (278 linjer), `EnhancedActionTemplateList` (156 linjer)
- 📦 Kan fjernes: `ActionTemplateList` (wrapper, 28 linjer)
- 🔄 Trenger refaktorering: Alle template-lister, phase mapping, filter-state

---

## Neste steg

Se [architecture.md](./architecture.md) for full arkitektur-oversikt og [migration-checklist.md](./migration-checklist.md) for migreringsstrategi.
