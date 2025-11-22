# Best Practices - Revisjonshandlinger

Anbefalte patterns, design-prinsipper og løsninger for Audit Actions-systemet.

---

## 📋 Innhold

1. [Komponentbruk](#komponentbruk)
2. [Performance-optimalisering](#performance-optimalisering)
3. [State Management](#state-management)
4. [Error Handling](#error-handling)
5. [Testing Patterns](#testing-patterns)
6. [Type Safety](#type-safety)
7. [Design Patterns](#design-patterns)

---

## Komponentbruk

### Når skal man bruke ActionList?

**✅ Bruk ActionList når:**
- Du har >50 items (virtualisering trengs)
- Du trenger drag-n-drop funksjonalitet
- Du trenger multi-select med checkboxes
- Du vil ha konsistent empty/loading states
- Du vil ha keyboard shortcuts (Ctrl+A, Escape, etc.)

**❌ Bruk IKKE ActionList når:**
- Du har <20 items og performance ikke er et problem
- Du trenger en helt custom layout som ikke passer ActionList
- Du viser data i et annet format (f.eks. kanban, timeline)

**Eksempel - Riktig bruk:**
```typescript
import { ActionList } from '@/components/AuditActions/core/ActionList';
import { ActionCard } from '@/components/AuditActions/core/ActionCard';

function TemplateLibrary({ templates }: { templates: AuditActionTemplate[] }) {
  return (
    <ActionList
      items={templates}
      renderItem={(template) => (
        <ActionCard 
          action={template}
          showCheckbox
          onSelect={() => console.log('Selected')}
        />
      )}
      enableVirtualization={templates.length > 50}
      enableDragDrop={false}
    />
  );
}
```

---

### Når skal man bruke ActionCard?

**✅ Bruk ActionCard når:**
- Du viser en action eller template
- Du vil ha konsistent badge-rendering
- Du trenger quick actions (start, stop, complete)
- Du vil ha uniform styling på tvers av appen

**❌ Bruk IKKE ActionCard når:**
- Du trenger en helt minimal visning (f.eks. bare navn i dropdown)
- Du viser ikke-action data (f.eks. klient, bruker)
- Du trenger custom layout som ikke passer card-format

**Eksempel - Custom card med ActionCard som base:**
```typescript
import { ActionCard } from '@/components/AuditActions/core/ActionCard';

function MyCustomCard({ action }: { action: ClientAuditAction }) {
  return (
    <ActionCard action={action}>
      {/* Custom content kan legges til under */}
      <div className="mt-4 border-t pt-4">
        <p>Custom info: {action.custom_field}</p>
      </div>
    </ActionCard>
  );
}
```

---

### Når skal man bruke ActionFilters?

**✅ Bruk ActionFilters når:**
- Du har en liste med >10 items
- Du trenger standardfiltre (søk, risk, phase, subject area)
- Du vil ha konsistent filter-UI på tvers av appen

**❌ Bruk IKKE ActionFilters når:**
- Du har helt custom filter-behov (f.eks. date range, assigned user)
- Du trenger bare én enkel filter (bruk bare en input)

**Eksempel - Kombinere standard og custom filters:**
```typescript
import { ActionFilters } from '@/components/AuditActions/core/ActionFilters';
import { Input } from '@/components/ui/input';

function MyFilteredList() {
  const [filters, setFilters] = useState<FilterState>({});
  const [customFilter, setCustomFilter] = useState('');
  
  return (
    <div>
      <ActionFilters
        value={filters}
        onChange={setFilters}
      />
      {/* Legg til custom filter */}
      <Input
        placeholder="Filter by assigned user..."
        value={customFilter}
        onChange={(e) => setCustomFilter(e.target.value)}
      />
    </div>
  );
}
```

---

## Performance-optimalisering

### Virtualisering

**Regel:** Aktiver virtualisering for lister med >50 items.

**Hvorfor:**
- React rendrer kun synlige items
- Drastisk bedre performance for store lister
- Smooth scrolling selv med 1000+ items

**Eksempel:**
```typescript
<ActionList
  items={largeArray}
  renderItem={(item) => <ActionCard action={item} />}
  enableVirtualization={largeArray.length > 50} // ✅ Automatisk aktivering
/>
```

---

### Bulk Operations

**Regel:** Alltid bruk batch-updates for >5 items.

**❌ Dårlig - Individuelle updates:**
```typescript
// Sender 100 separate requests
for (const id of selectedIds) {
  await updateAction(id, { status: 'completed' });
}
```

**✅ Bra - Batch update:**
```typescript
import { useBulkUpdateClientActionsStatus } from '@/hooks/audit-actions/useClientActionBulk';

const { mutate: bulkUpdate } = useBulkUpdateClientActionsStatus();

bulkUpdate({
  actionIds: selectedIds, // [100 IDs]
  status: 'completed',
  clientId
});
// Sender 1 request med alle IDs
```

---

### React Query Caching

**Regel:** Bruk smart cache invalidation.

**❌ Dårlig - Invaliderer alt:**
```typescript
queryClient.invalidateQueries(); // ❌ Invaliderer ALLE queries
```

**✅ Bra - Targeted invalidation:**
```typescript
// Invaliderer kun relevante queries
queryClient.invalidateQueries({ 
  queryKey: ['client-audit-actions', clientId] 
});
```

**Best practice - Optimistic updates:**
```typescript
const { mutate } = useUpdateAuditAction();

mutate(updatedAction, {
  onMutate: async (newAction) => {
    // Oppdater cache optimistisk
    await queryClient.cancelQueries({ queryKey: ['client-audit-actions'] });
    const previousActions = queryClient.getQueryData(['client-audit-actions']);
    
    queryClient.setQueryData(['client-audit-actions'], (old: any[]) =>
      old.map(a => a.id === newAction.id ? { ...a, ...newAction } : a)
    );
    
    return { previousActions };
  },
  onError: (err, newAction, context) => {
    // Rollback ved feil
    queryClient.setQueryData(['client-audit-actions'], context.previousActions);
  }
});
```

---

### Lazy Loading

**Regel:** Lazy load features som ikke brukes i første render.

**Eksempel:**
```typescript
import { lazy, Suspense } from 'react';

// ❌ Lastes alltid, selv om ikke brukt
import { WorkingPaperGenerator } from '@/components/AuditActions/WorkingPaperGenerator';

// ✅ Lastes kun når bruker åpner working paper
const WorkingPaperGenerator = lazy(() => 
  import('@/components/AuditActions/WorkingPaperGenerator')
);

function MyComponent() {
  const [showWorkingPaper, setShowWorkingPaper] = useState(false);
  
  return (
    <div>
      <button onClick={() => setShowWorkingPaper(true)}>
        Generate Working Paper
      </button>
      
      {showWorkingPaper && (
        <Suspense fallback={<div>Loading...</div>}>
          <WorkingPaperGenerator />
        </Suspense>
      )}
    </div>
  );
}
```

---

## State Management

### Global vs. Local State

**Regel:** Bruk riktig scope for state.

**Global state (Context):**
- ✅ Selection across multiple components
- ✅ Bulk operation state
- ✅ Filter state som deles av flere lister

**Local state:**
- ✅ Form input values
- ✅ Toggle states (open/closed dialogs)
- ✅ View modes (basic/enhanced)

**Eksempel - Global selection:**
```typescript
import { AuditActionsProvider, useAuditActionsContext } from '@/contexts/AuditActionsContext';

function App() {
  return (
    <AuditActionsProvider clientId={clientId}>
      <TemplateLibrary />
      <BulkActionsToolbar />
    </AuditActionsProvider>
  );
}

function TemplateLibrary() {
  const { selectedIds, toggleSelect } = useAuditActionsContext();
  // Deler state med BulkActionsToolbar
}

function BulkActionsToolbar() {
  const { selectedIds, bulkDelete } = useAuditActionsContext();
  // Samme state
}
```

---

### Form State

**Regel:** Bruk React Hook Form for komplekse forms.

**✅ Best practice:**
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Navn er påkrevd'),
  risk_level: z.enum(['low', 'medium', 'high', 'critical']),
  estimated_hours: z.number().min(0).optional()
});

function CreateActionForm() {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      risk_level: 'medium',
      estimated_hours: 4
    }
  });
  
  const onSubmit = form.handleSubmit((data) => {
    createAction(data);
  });
  
  return (
    <form onSubmit={onSubmit}>
      {/* form fields */}
    </form>
  );
}
```

---

## Error Handling

### Håndter errors gracefully

**Regel:** Alltid vis bruker-vennlige feilmeldinger.

**❌ Dårlig - Ingen error handling:**
```typescript
const { data } = useAuditActionTemplates();
return <div>{data.map(...)}</div>; // Crashes hvis data er undefined
```

**✅ Bra - Proper error handling:**
```typescript
const { data, isLoading, error } = useAuditActionTemplates();

if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage message={error.message} />;
if (!data || data.length === 0) return <EmptyState />;

return <div>{data.map(...)}</div>;
```

---

### Toast Notifications

**Regel:** Bruk konsistente toast-meldinger.

**✅ Best practice:**
```typescript
import { toast } from 'sonner';

// Success
toast.success('Handlingsmal opprettet');

// Error med detaljer
toast.error('Feil ved opprettelse', {
  description: error.message
});

// Loading med promise
toast.promise(
  createTemplate(data),
  {
    loading: 'Oppretter mal...',
    success: 'Mal opprettet!',
    error: 'Kunne ikke opprette mal'
  }
);
```

---

### Rollback ved feil

**Regel:** Bruk optimistic updates med rollback.

```typescript
const { mutate } = useUpdateAction();

mutate(newData, {
  onMutate: async () => {
    // Lagre gammel data
    const previous = queryClient.getQueryData(['actions']);
    // Oppdater optimistisk
    queryClient.setQueryData(['actions'], newData);
    return { previous };
  },
  onError: (err, vars, context) => {
    // Rollback ved feil
    queryClient.setQueryData(['actions'], context.previous);
    toast.error('Oppdatering feilet - endringer rullet tilbake');
  }
});
```

---

## Testing Patterns

### Unit Testing Hooks

**Regel:** Test hooks med `@testing-library/react-hooks`.

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useAuditActionTemplates } from '@/hooks/audit-actions/useActionTemplateCRUD';

describe('useAuditActionTemplates', () => {
  it('should fetch templates', async () => {
    const { result } = renderHook(() => useAuditActionTemplates());
    
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    
    expect(result.current.data).toHaveLength(10);
  });
});
```

---

### Component Testing

**Regel:** Test user interactions, ikke implementation.

**✅ Bra test:**
```typescript
import { render, screen, userEvent } from '@testing-library/react';
import { TemplateLibrary } from '@/components/AuditActions/TemplateLibrary';

describe('TemplateLibrary', () => {
  it('should allow user to select and copy template', async () => {
    render(<TemplateLibrary phase="execution" onCopyToClient={mockFn} />);
    
    // User selects template
    const checkbox = screen.getByRole('checkbox', { name: /select template/i });
    await userEvent.click(checkbox);
    
    // User clicks copy button
    const copyButton = screen.getByRole('button', { name: /copy to client/i });
    await userEvent.click(copyButton);
    
    // Verify callback was called
    expect(mockFn).toHaveBeenCalledWith(expect.any(String));
  });
});
```

---

### Visual Regression Testing

**Regel:** Snapshot key components.

```typescript
import { render } from '@testing-library/react';
import { ActionCard } from '@/components/AuditActions/core/ActionCard';

describe('ActionCard', () => {
  it('should match snapshot', () => {
    const { container } = render(
      <ActionCard 
        action={mockAction}
        showCheckbox
      />
    );
    
    expect(container).toMatchSnapshot();
  });
});
```

---

## Type Safety

### Bruk type guards

**Regel:** Valider data før bruk.

```typescript
import type { ClientAuditAction } from '@/types/audit-actions';

function isClientAction(action: any): action is ClientAuditAction {
  return (
    typeof action === 'object' &&
    action !== null &&
    'id' in action &&
    'client_id' in action &&
    'status' in action
  );
}

function processAction(action: unknown) {
  if (!isClientAction(action)) {
    throw new Error('Invalid action data');
  }
  
  // TypeScript vet nå at action er ClientAuditAction
  console.log(action.status);
}
```

---

### Bruk discriminated unions

**Regel:** Type-safe state handling.

```typescript
type ViewState =
  | { type: 'loading' }
  | { type: 'error'; message: string }
  | { type: 'success'; data: AuditActionTemplate[] };

function MyComponent() {
  const [state, setState] = useState<ViewState>({ type: 'loading' });
  
  // TypeScript tvinger oss til å håndtere alle states
  switch (state.type) {
    case 'loading':
      return <LoadingSpinner />;
    case 'error':
      return <ErrorMessage message={state.message} />;
    case 'success':
      return <ActionList items={state.data} />;
  }
}
```

---

### Strict null checks

**Regel:** Alltid håndter null/undefined.

**❌ Dårlig:**
```typescript
function getActionName(action: ClientAuditAction) {
  return action.name.toUpperCase(); // Crash hvis name er null
}
```

**✅ Bra:**
```typescript
function getActionName(action: ClientAuditAction): string {
  return action.name?.toUpperCase() ?? 'Uten navn';
}
```

---

## Design Patterns

### Composition over Inheritance

**Regel:** Bygg features via composition.

**✅ Bra - Composable ActionCard:**
```typescript
import { ActionCard } from '@/components/AuditActions/core/ActionCard';

function EnhancedActionCard({ action }: { action: ClientAuditAction }) {
  return (
    <ActionCard action={action}>
      {/* Legg til ekstra funksjonalitet via children */}
      <div className="mt-4 border-t pt-4">
        <h4>ISA Standards</h4>
        <ActionISAStandards templateId={action.template_id} />
      </div>
    </ActionCard>
  );
}
```

---

### Render Props

**Regel:** Gi flexibility via render props.

```typescript
interface ActionListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  renderEmpty?: () => React.ReactNode;
}

function ActionList<T>({ items, renderItem, renderEmpty }: ActionListProps<T>) {
  if (items.length === 0 && renderEmpty) {
    return <>{renderEmpty()}</>;
  }
  
  return (
    <div>
      {items.map((item, idx) => (
        <div key={idx}>{renderItem(item)}</div>
      ))}
    </div>
  );
}

// Bruk
<ActionList
  items={actions}
  renderItem={(action) => <ActionCard action={action} />}
  renderEmpty={() => <CustomEmptyState />}
/>
```

---

### Custom Hooks for Logic Reuse

**Regel:** Ekstraher gjenbrukbar logikk til hooks.

**Eksempel - useFilteredActions:**
```typescript
function useFilteredActions(
  actions: ClientAuditAction[],
  filters: FilterState
) {
  return useMemo(() => {
    let filtered = actions;
    
    if (filters.searchTerm) {
      filtered = filtered.filter(a =>
        a.name.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }
    
    if (filters.riskLevel) {
      filtered = filtered.filter(a => a.risk_level === filters.riskLevel);
    }
    
    return filtered;
  }, [actions, filters]);
}

// Bruk i flere komponenter
function ClientActionsList() {
  const { data: actions } = useClientActions(clientId);
  const [filters, setFilters] = useState({});
  const filteredActions = useFilteredActions(actions, filters);
  
  return <ActionList items={filteredActions} />;
}
```

---

## Oppsummering

### Do's ✅

- ✅ Bruk core components (ActionCard, ActionList, ActionFilters)
- ✅ Aktiver virtualisering for lister >50 items
- ✅ Bruk bulk operations for >5 items
- ✅ Implementer optimistic updates
- ✅ Håndter errors gracefully med toast
- ✅ Test user interactions, ikke implementation
- ✅ Bruk type guards og strict null checks
- ✅ Prefer composition over inheritance

### Don'ts ❌

- ❌ Dupliser badge-logikk eller phase-mapping
- ❌ Lag egne liste-komponenter uten grunn
- ❌ Send individuelle requests i loops
- ❌ Ignorer loading/error states
- ❌ Hardkod subject area labels
- ❌ Invalidate alle queries unødvendig
- ❌ Test implementation details
- ❌ Bruk `any` type

---

## Se også

- **[API-referanse](./api-reference.md)** - Detaljert dokumentasjon av hooks og utilities
- **[Utviklerguide](./dev-guide.md)** - Praktiske how-tos
- **[Arkitektur](./architecture.md)** - System design og dataflyt
- **[Migreringsguide](./migration-guide.md)** - Oppgradering fra gammel kode

---

**Sist oppdatert:** November 2025  
**Vedlikeholdes av:** Revio Development Team
