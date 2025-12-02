# Audit Actions Hooks

## Oversikt

Denne modulen inneholder React hooks for håndtering av revisjonshandlinger. Hooks er organisert etter funksjonalitet.

## Import

```typescript
// Anbefalt: Import fra index
import { useActionEditor, useCompleteAction } from '@/hooks/audit-actions';

// Alternativt: Direkte import
import { useActionEditor } from '@/hooks/audit-actions/useActionEditor';
```

## Hooks

### Template CRUD

#### `useAuditActionTemplates(subjectArea?)`
Henter handlingsmaler fra databasen.

```typescript
const { data: templates, isLoading } = useAuditActionTemplates('sales');
```

#### `useCreateAuditActionTemplate()`
Oppretter en ny handlingsmal.

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

#### `useDeleteOldClientActions()`
Sletter gamle handlinger uten template_id (opprydding).

### Arbeidsflyt

#### `useCompleteAction()`
Markerer en handling som fullført.

#### `useStartTimeTracking()`
Starter tidregistrering for en handling.

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

#### `calculateCompletionPercentage(fields, values)`
Beregner prosent av obligatoriske felter som er utfylt.

### Kommentarer

#### `useActionComments(actionId)`
Henter kommentarer for en handling.

#### `useCreateComment()`
Oppretter en ny kommentar.

#### `useDeleteComment()`
Sletter en kommentar.

#### `useResolveComment()`
Markerer en kommentar som løst.

### Hjelpehooks

#### `useSubjectAreaLabels()`
Henter dynamiske labels for fagområder fra databasen.

#### `useTemplateFilters()`
Håndterer filtrering av handlingsmaler.

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
