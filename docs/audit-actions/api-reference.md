# API-referanse - Revisjonshandlinger

Fullstendig dokumentasjon av hooks, utilities og type-definisjoner.

---

## 📋 Innhold

1. [Hooks](#hooks)
2. [Utilities](#utilities)
3. [Constants](#constants)
4. [Type Definisjoner](#type-definisjoner)

---

## Hooks

### Template CRUD Operations

#### `useAuditActionTemplates()`

Henter revisjonshandlingsmaler fra database.

**Signatur:**
```typescript
function useAuditActionTemplates(
  subjectArea?: AuditSubjectArea
): UseQueryResult<AuditActionTemplate[]>
```

**Parametere:**
- `subjectArea` (optional) - Filtrer maler på fagområde (UUID eller legacy string)

**Return:**
- `data` - Array av templates (eller undefined)
- `isLoading` - Loading state
- `error` - Error object hvis noe gikk galt
- `refetch` - Funksjon for å re-fetch data

**Eksempel:**
```typescript
import { useAuditActionTemplates } from '@/hooks/audit-actions/useActionTemplateCRUD';

function TemplateList() {
  const { data: templates, isLoading, error } = useAuditActionTemplates('sales');
  
  if (isLoading) return <div>Laster...</div>;
  if (error) return <div>Feil: {error.message}</div>;
  
  return (
    <div>
      {templates?.map(t => (
        <div key={t.id}>{t.name}</div>
      ))}
    </div>
  );
}
```

**React Query Key:**
```typescript
['audit-action-templates', subjectArea]
```

---

#### `useCreateAuditActionTemplate()`

Opprett ny handlingsmal.

**Signatur:**
```typescript
function useCreateAuditActionTemplate(): UseMutationResult<
  AuditActionTemplate,
  Error,
  Omit<AuditActionTemplate, 'id' | 'created_at' | 'updated_at'>
>
```

**Return:**
- `mutate(templateData)` - Asynkron funksjon for å opprette mal
- `mutateAsync(templateData)` - Returnerer Promise
- `isLoading` - Loading state
- `error` - Error object

**Eksempel:**
```typescript
import { useCreateAuditActionTemplate } from '@/hooks/audit-actions/useActionTemplateCRUD';

function CreateTemplateButton() {
  const { mutate: createTemplate, isLoading } = useCreateAuditActionTemplate();
  
  const handleCreate = () => {
    createTemplate({
      name: 'Verifiser salg',
      description: 'Kontroller salgstransaksjoner',
      subject_area: 'sales',
      applicable_phases: ['execution'],
      risk_level: 'medium',
      estimated_hours: 4,
      procedures: 'Se arbeidspapir for detaljer'
    });
  };
  
  return (
    <button onClick={handleCreate} disabled={isLoading}>
      {isLoading ? 'Oppretter...' : 'Opprett mal'}
    </button>
  );
}
```

**Side-effekter:**
- ✅ Invaliderer `['audit-action-templates']` query
- ✅ Viser toast-melding ved suksess/feil

---

#### `useUpdateAuditActionTemplate()`

Oppdater eksisterende handlingsmal.

**Signatur:**
```typescript
function useUpdateAuditActionTemplate(): UseMutationResult<
  AuditActionTemplate,
  Error,
  { id: string } & Partial<AuditActionTemplate>
>
```

**Eksempel:**
```typescript
import { useUpdateAuditActionTemplate } from '@/hooks/audit-actions/useActionTemplateCRUD';

function UpdateTemplateButton({ templateId }: { templateId: string }) {
  const { mutate: updateTemplate } = useUpdateAuditActionTemplate();
  
  const handleUpdate = () => {
    updateTemplate({
      id: templateId,
      risk_level: 'high',
      estimated_hours: 8
    });
  };
  
  return <button onClick={handleUpdate}>Øk risiko</button>;
}
```

---

#### `useDeleteAuditActionTemplate()`

Slett handlingsmal.

**Signatur:**
```typescript
function useDeleteAuditActionTemplate(): UseMutationResult<
  void,
  Error,
  string
>
```

**Eksempel:**
```typescript
import { useDeleteAuditActionTemplate } from '@/hooks/audit-actions/useActionTemplateCRUD';

function DeleteTemplateButton({ templateId }: { templateId: string }) {
  const { mutate: deleteTemplate } = useDeleteAuditActionTemplate();
  
  return (
    <button onClick={() => deleteTemplate(templateId)}>
      Slett
    </button>
  );
}
```

---

### Bulk Operations

#### `useBulkUpdateClientActionsStatus()`

Oppdater status på flere handlinger samtidig.

**Signatur:**
```typescript
function useBulkUpdateClientActionsStatus(): UseMutationResult<
  void,
  Error,
  { actionIds: string[]; status: ActionStatus; clientId: string }
>
```

**Eksempel:**
```typescript
import { useBulkUpdateClientActionsStatus } from '@/hooks/audit-actions/useClientActionBulk';

function BulkStatusUpdate({ selectedIds, clientId }: Props) {
  const { mutate: updateStatus } = useBulkUpdateClientActionsStatus();
  
  const markAsCompleted = () => {
    updateStatus({
      actionIds: selectedIds,
      status: 'completed',
      clientId
    });
  };
  
  return <button onClick={markAsCompleted}>Marker som fullført</button>;
}
```

---

#### `useBulkDeleteClientActions()`

Slett flere handlinger samtidig.

**Signatur:**
```typescript
function useBulkDeleteClientActions(): UseMutationResult<
  void,
  Error,
  { actionIds: string[]; clientId: string }
>
```

**Eksempel:**
```typescript
import { useBulkDeleteClientActions } from '@/hooks/audit-actions/useClientActionBulk';

function BulkDelete({ selectedIds, clientId }: Props) {
  const { mutate: deleteActions } = useBulkDeleteClientActions();
  
  return (
    <button onClick={() => deleteActions({ actionIds: selectedIds, clientId })}>
      Slett valgte ({selectedIds.length})
    </button>
  );
}
```

---

#### `useReorderClientAuditActions()`

Reorder handlinger via drag-n-drop.

**Signatur:**
```typescript
function useReorderClientAuditActions(): UseMutationResult<
  void,
  Error,
  { clientId: string; phase: AuditPhase; reorderedActions: Array<{ id: string; sort_order: number }> }
>
```

**Eksempel:**
```typescript
import { useReorderClientAuditActions } from '@/hooks/audit-actions/useClientActionBulk';

function DraggableList({ actions, clientId, phase }: Props) {
  const { mutate: reorder } = useReorderClientAuditActions();
  
  const handleDragEnd = (result: DropResult) => {
    const reorderedActions = actions.map((a, idx) => ({
      id: a.id,
      sort_order: idx
    }));
    
    reorder({ clientId, phase, reorderedActions });
  };
  
  return <DndContext onDragEnd={handleDragEnd}>...</DndContext>;
}
```

---

### Subject Areas

#### `useSubjectAreaLabels()`

Hent dynamiske fagområder fra database.

**Signatur:**
```typescript
function useSubjectAreaLabels(): {
  labelMap: Record<string, string>;
  options: Array<{ value: string; label: string; icon?: string; color?: string }>;
  getLabel: (name: string) => string;
  isLoading: boolean;
}
```

**Return:**
- `labelMap` - Object mapping fra name → display_name
- `options` - Array av select-options (sortert etter sort_order)
- `getLabel(name)` - Funksjon for å hente label for et fagområde
- `isLoading` - Loading state

**Eksempel:**
```typescript
import { useSubjectAreaLabels } from '@/hooks/audit-actions/useSubjectAreaLabels';

function SubjectAreaSelect() {
  const { options, isLoading } = useSubjectAreaLabels();
  
  if (isLoading) return <div>Laster fagområder...</div>;
  
  return (
    <select>
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>
          {opt.icon} {opt.label}
        </option>
      ))}
    </select>
  );
}
```

---

## Utilities

### Badge Utilities

#### `getRiskBadgeVariant()`

Returner badge-variant for risikonivå.

**Signatur:**
```typescript
function getRiskBadgeVariant(
  riskLevel: string
): 'destructive' | 'default' | 'secondary' | 'outline'
```

**Mapping:**
| Risk Level | Variant | Color |
|-----------|---------|-------|
| `critical`, `high` | `destructive` | Rød |
| `medium` | `default` | Blå |
| `low` | `secondary` | Grå |
| (annet) | `outline` | Outline |

**Eksempel:**
```typescript
import { getRiskBadgeVariant } from '@/components/AuditActions/core/badgeUtils';
import { Badge } from '@/components/ui/badge';

function RiskBadge({ riskLevel }: { riskLevel: string }) {
  return (
    <Badge variant={getRiskBadgeVariant(riskLevel)}>
      {riskLevel}
    </Badge>
  );
}
```

---

#### `getRiskLabel()`

Konverter risk level til norsk label.

**Signatur:**
```typescript
function getRiskLabel(riskLevel: string): string
```

**Mapping:**
- `critical` → "Kritisk risiko"
- `high` → "Høy risiko"
- `medium` → "Medium risiko"
- `low` → "Lav risiko"

**Eksempel:**
```typescript
import { getRiskLabel } from '@/components/AuditActions/core/badgeUtils';

const label = getRiskLabel('high'); // "Høy risiko"
```

---

#### `getComplexityBadgeVariant()`

Returner badge-variant basert på kompleksitet (1-5).

**Signatur:**
```typescript
function getComplexityBadgeVariant(
  complexity: number
): 'secondary' | 'default' | 'destructive'
```

**Mapping:**
| Complexity | Variant | Label |
|-----------|---------|-------|
| 1-2 | `secondary` | Enkel |
| 3 | `default` | Moderat |
| 4-5 | `destructive` | Kompleks |

---

#### `getStatusBadgeVariant()`

Returner badge-variant for action status.

**Signatur:**
```typescript
function getStatusBadgeVariant(
  status: ActionStatus
): 'secondary' | 'default' | 'outline'
```

---

### Phase Utilities

#### `toDbPhase()`

Konverter UI phase til database enum.

**Signatur:**
```typescript
function toDbPhase(phase: AuditPhase): DbAuditPhase | null
```

**Mapping:**
- `overview` → `null`
- `engagement` → `'engagement'`
- `planning` → `'planning'`
- `risk_assessment` → `'planning'` (!) 
- `execution` → `'execution'`
- `completion` → `'conclusion'` (!)
- `reporting` → `'reporting'`

**Eksempel:**
```typescript
import { toDbPhase } from '@/constants/auditPhases';

const dbPhase = toDbPhase('completion'); // 'conclusion'
```

---

#### `fromDbPhase()`

Konverter database enum til UI phase.

**Signatur:**
```typescript
function fromDbPhase(dbPhase: string | null): AuditPhase
```

**Eksempel:**
```typescript
import { fromDbPhase } from '@/constants/auditPhases';

const uiPhase = fromDbPhase('conclusion'); // 'completion'
const overviewPhase = fromDbPhase(null); // 'overview'
```

---

#### `getPhaseLabel()`

Hent norsk label for fase.

**Signatur:**
```typescript
function getPhaseLabel(phase: AuditPhase): string
```

**Mapping:**
- `overview` → "Oversikt"
- `engagement` → "Oppdragsvurdering"
- `planning` → "Planlegging"
- `risk_assessment` → "Risikovurdering"
- `execution` → "Utførelse"
- `completion` → "Avslutning"
- `reporting` → "Rapportering"

**Eksempel:**
```typescript
import { getPhaseLabel } from '@/constants/auditPhases';

const label = getPhaseLabel('execution'); // "Utførelse"
```

---

## Constants

### `PHASE_CONFIG`

Fullstendig konfigurasjon for alle faser.

**Type:**
```typescript
type PhaseConfig = {
  dbValue: string | null;
  label: string;
  color: string;
  icon: LucideIcon;
  description: string;
};

const PHASE_CONFIG: Record<AuditPhase, PhaseConfig>;
```

**Eksempel:**
```typescript
import { PHASE_CONFIG } from '@/constants/auditPhases';

const executionConfig = PHASE_CONFIG.execution;
// {
//   dbValue: 'execution',
//   label: 'Utførelse',
//   color: 'bg-blue-500',
//   icon: PlayIcon,
//   description: 'Gjennomføring av revisjonshandlinger'
// }
```

---

### `PHASE_ORDER`

Array som definerer rekkefølgen på faser.

**Type:**
```typescript
const PHASE_ORDER: AuditPhase[] = [
  'overview',
  'engagement',
  'planning',
  'risk_assessment',
  'execution',
  'completion',
  'reporting'
];
```

**Eksempel:**
```typescript
import { PHASE_ORDER } from '@/constants/auditPhases';

const tabs = PHASE_ORDER.map(phase => ({
  value: phase,
  label: getPhaseLabel(phase)
}));
```

---

## Type Definisjoner

### `AuditPhase`

Union type for UI-faser.

```typescript
export type AuditPhase =
  | 'overview'
  | 'engagement'
  | 'planning'
  | 'risk_assessment'
  | 'execution'
  | 'completion'
  | 'reporting';
```

---

### `AuditActionTemplate`

Type for handlingsmal.

```typescript
export interface AuditActionTemplate {
  id: string;
  name: string;
  description: string | null;
  subject_area: AuditSubjectArea;
  subject_area_id: string | null;
  applicable_phases: AuditPhase[];
  risk_level: RiskLevel;
  action_type: ActionType;
  objective: string | null;
  procedures: string | null;
  documentation_requirements: string | null;
  estimated_hours: number | null;
  is_system_template: boolean;
  is_active: boolean;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
}
```

---

### `ClientAuditAction`

Type for klient-handling.

```typescript
export interface ClientAuditAction {
  id: string;
  client_id: string;
  template_id: string | null;
  phase: AuditPhase;
  status: ActionStatus;
  name: string;
  description: string | null;
  subject_area: AuditSubjectArea;
  risk_level: RiskLevel;
  assigned_to: string | null;
  reviewed_by: string | null;
  due_date: string | null;
  completed_at: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  sort_order: number;
  // ... flere felt
}
```

---

### `ActionStatus`

Union type for handling-status.

```typescript
export type ActionStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'reviewed'
  | 'approved';
```

---

### `RiskLevel`

Union type for risikonivå.

```typescript
export type RiskLevel =
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';
```

---

## Context API

### `AuditActionsContext`

Global state for audit actions selection og bulk operations.

**Interface:**
```typescript
interface AuditActionsContextValue {
  // Selection state
  selectedIds: string[];
  toggleSelect: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
  
  // Bulk operations
  bulkUpdateStatus: (status: ActionStatus) => void;
  bulkDelete: () => void;
  
  // Loading/error states
  isLoading: boolean;
  error: Error | null;
}
```

**Bruk:**
```typescript
import { useAuditActionsContext } from '@/contexts/AuditActionsContext';

function MyComponent() {
  const { selectedIds, toggleSelect, bulkDelete } = useAuditActionsContext();
  
  return (
    <div>
      <p>{selectedIds.length} valgt</p>
      <button onClick={() => bulkDelete()}>Slett valgte</button>
    </div>
  );
}
```

---

## React Query Keys

Oversikt over alle query keys:

```typescript
// Templates
['audit-action-templates']                      // Alle templates
['audit-action-templates', subjectArea]         // Filtrert på fagområde
['action-template', templateId]                 // Enkelt template

// Client Actions
['client-audit-actions', clientId]              // Alle actions for klient
['client-audit-actions', clientId, phase]       // Filtrert på fase
['client-audit-action', actionId]               // Enkelt action

// Subject Areas
['subject-areas']                               // Alle fagområder

// ISA Standards
['action-isa-mappings', templateId]             // ISA-koblinger for template

// Document Requirements
['action-document-mappings', templateId]        // Dokument-koblinger
```

**Best practice:**
```typescript
// Invalidate alle templates
queryClient.invalidateQueries({ queryKey: ['audit-action-templates'] });

// Invalidate kun for spesifikt fagområde
queryClient.invalidateQueries({ 
  queryKey: ['audit-action-templates', 'sales'] 
});
```

---

## Se også

- **[Utviklerguide](./dev-guide.md)** - Praktiske eksempler og how-tos
- **[Arkitektur](./architecture.md)** - Systemarkitektur og dataflyt
- **[Best Practices](./best-practices.md)** - Anbefalte patterns
