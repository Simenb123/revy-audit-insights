# Audit Actions Hooks

## Oversikt

Denne modulen inneholder React hooks for håndtering av revisjonshandlinger. Hooks er organisert etter funksjonalitet og følger beste praksis for typesikkerhet og gjenbrukbarhet.

## Import

```typescript
// Anbefalt: Import fra index
import { 
  useActionEditor, 
  useCompleteAction,
  useAuditActionTemplates,
  validateResponseFields 
} from '@/hooks/audit-actions';

// Alternativt: Direkte import
import { useActionEditor } from '@/hooks/audit-actions/useActionEditor';
```

## Hooks

### Template CRUD

#### `useAuditActionTemplates(subjectArea?)`
Henter handlingsmaler fra databasen med valgfri filtrering på fagområde.

```typescript
const { data: templates, isLoading } = useAuditActionTemplates('sales');
```

#### `useCreateAuditActionTemplate()`
Oppretter en ny handlingsmal med validering av fagområde.

```typescript
const createMutation = useCreateAuditActionTemplate();
createMutation.mutate({
  name: 'Ny handling',
  subject_area: 'revenue',
  applicable_phases: ['planning', 'execution'],
  // ... andre felter
});
```

#### `useUpdateAuditActionTemplate()`
Oppdaterer en eksisterende handlingsmal.

#### `useDeleteAuditActionTemplate()`
Sletter en handlingsmal.

### Klienthandlinger

#### `useDeleteClientAction()`
Sletter en klientspesifikk handling.

```typescript
const deleteMutation = useDeleteClientAction();
deleteMutation.mutate({ actionId: 'xxx', clientId: 'yyy' });
```

#### `useCopyActionsFromClient()`
Kopierer handlinger fra en annen klient.

```typescript
const copyMutation = useCopyActionsFromClient();
copyMutation.mutate({
  sourceClientId: 'source-id',
  targetClientId: 'target-id',
  actionIds: ['action-1', 'action-2'],
  phase: 'planning'
});
```

#### `useDeleteOldClientActions()`
Sletter gamle handlinger uten template_id (opprydding).

```typescript
const deleteMutation = useDeleteOldClientActions();
deleteMutation.mutate('client-id');
```

### Bulk-operasjoner

#### `useReorderClientAuditActions()`
Omorganiserer handlinger via drag-and-drop.

```typescript
const reorderMutation = useReorderClientAuditActions();
reorderMutation.mutate({
  clientId: 'client-id',
  updates: [
    { id: 'action-1', sort_order: 0 },
    { id: 'action-2', sort_order: 1 }
  ]
});
```

#### `useBulkUpdateClientActionsStatus()`
Oppdaterer status for flere handlinger samtidig.

#### `useBulkDeleteClientActions()`
Sletter flere handlinger samtidig.

### Arbeidsflyt

#### `useCompleteAction()`
Markerer en handling som fullført med valgfri tidregistrering.

```typescript
const completeMutation = useCompleteAction();
completeMutation.mutate({
  actionId: 'xxx',
  clientId: 'yyy',
  actualHours: 2.5
});
```

#### `useStartTimeTracking()`
Starter tidregistrering for en handling og setter status til 'in_progress'.

```typescript
const startMutation = useStartTimeTracking();
startMutation.mutate({ actionId: 'xxx', clientId: 'yyy' });
```

### Redigering og Validering

#### `useActionEditor(action, responseFields?)`
Konsolidert hook for redigering av handlinger. Håndterer:
- Status-endringer med validering
- Response field state management
- Lagring med optimistisk UI
- Fullføringsprosent-beregning

```typescript
const {
  status,
  responseFieldValues,
  responseFieldErrors,
  hasChanges,
  isUpdating,
  handleStatusChange,
  handleResponseFieldChange,
  handleSave,
  getCompletionPercentage,
} = useActionEditor(action, template?.response_fields);
```

#### `validateResponseFields(fields, values)`
Validerer at alle obligatoriske felter er fylt ut.

```typescript
const { isValid, errors } = validateResponseFields(
  template.response_fields,
  formValues
);
```

#### `calculateCompletionPercentage(fields, values)`
Beregner prosent av obligatoriske felter som er utfylt.

```typescript
const percentage = calculateCompletionPercentage(
  template.response_fields,
  formValues
); // Returns 0-100
```

### Kommentarer

#### `useActionComments(actionId)`
Henter kommentarer for en handling i trådstruktur.

```typescript
const { data: comments, isLoading } = useActionComments(actionId);
// comments[0].replies inneholder svar på kommentaren
```

#### `useCreateComment()`
Oppretter en ny kommentar eller svar.

```typescript
const createMutation = useCreateComment();
createMutation.mutate({
  client_audit_action_id: 'action-id',
  content: 'Min kommentar',
  parent_comment_id: null // eller 'parent-id' for svar
});
```

#### `useDeleteComment()`
Sletter en kommentar.

#### `useResolveComment()`
Markerer en kommentar som løst eller gjenåpner den.

```typescript
const resolveMutation = useResolveComment();
resolveMutation.mutate({
  commentId: 'xxx',
  actionId: 'yyy',
  isResolved: true
});
```

### Hjelpehooks

#### `useSubjectAreaLabels()`
Henter dynamiske labels for fagområder fra databasen.

```typescript
const { getLabel, options, isLoading } = useSubjectAreaLabels();
console.log(getLabel('revenue')); // "Salgsinntekter"
```

#### `useTemplateFilters(templates, options)`
Håndterer filtrering av handlingsmaler med søk, risikonivå og fase.

```typescript
const {
  searchTerm,
  setSearchTerm,
  riskFilter,
  setRiskFilter,
  phaseFilter,
  setPhaseFilter,
  filteredTemplates
} = useTemplateFilters(templates, { 
  selectedArea: 'revenue',
  initialPhase: 'planning'
});
```

## Typer

Se `src/types/audit-actions.ts` og `src/types/working-paper.ts` for typedefinasjoner.

### WorkingPaperData
```typescript
interface WorkingPaperData {
  response_data?: WorkingPaperResponseData;
  notes?: string;
  linked_documents?: string[];
  metadata?: Record<string, unknown>;
}
```

### AutoMetrics
```typescript
interface AutoMetrics {
  first_viewed_at?: string;
  time_spent_seconds?: number;
  edit_count?: number;
  last_activity_at?: string;
}
```

### ResponseField
```typescript
interface ResponseField {
  id: string;
  required?: boolean;
  label?: string;
  type?: string;
  options?: string[];
  placeholder?: string;
}
```

### ActionComment
```typescript
interface ActionComment {
  id: string;
  client_audit_action_id: string;
  user_id: string;
  content: string;
  is_resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  parent_comment_id: string | null;
  created_at: string;
  updated_at: string;
  user?: { id: string; email: string; full_name: string | null; };
  resolver?: { id: string; email: string; full_name: string | null; };
  replies?: ActionComment[];
}
```

## Testing

Tester ligger i `src/hooks/audit-actions/__tests__/`. Kjør testene med:

```bash
npm run test -- src/hooks/audit-actions
```

Testene dekker:
- Validering av response fields
- Completion percentage beregning
- CRUD-operasjoner for templates og handlinger
- Kommentar-funksjonalitet
- Bulk-operasjoner
