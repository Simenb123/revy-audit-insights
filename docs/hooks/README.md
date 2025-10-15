# Hooks Library

**244+ custom React hooks for data fetching, state management og utilities**

Revio bruker en omfattende hooks-arkitektur for å håndtere all data-fetching, caching, og state management. Dette gjør koden gjenbrukbar, testbar, og enkel å vedlikeholde.

---

## 📁 Hooks Struktur

```
src/hooks/
├── audit-actions/          # Audit action templates, CRUD, filters
│   ├── useActionTemplateCRUD.ts
│   ├── useTemplateFilters.ts
│   └── useClientActionBulk.ts
├── knowledge/              # Knowledge base, documents, tags, subject areas
│   ├── useSubjectAreas.ts
│   ├── useDocumentSearch.ts
│   └── useTags.ts
├── useClients.ts           # Client management
├── useAccountingVersions.ts # GL versioning
├── useOptimizedAnalysis.ts # Performance-optimized analysis
├── useTransactions.ts      # Transaction data
├── useTrialBalanceData.ts  # Trial balance
└── use-toast.tsx           # Toast notifications
```

---

## 🎯 Core Patterns

### 1. **React Query Pattern** (Standard for data fetching)

Alle data-fetching hooks bruker React Query for automatisk caching, refetching og error handling.

**Eksempel: `useClients.ts` (Legacy useState pattern)**
```typescript
// ❌ GAMMELT PATTERN - Ikke bruk dette!
export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchClients();
  }, []);
  
  return { clients, loading, refetch };
}
```

**Riktig pattern: React Query**
```typescript
// ✅ RIKTIG PATTERN - Bruk React Query!
export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Client[];
    }
  });
}

// Bruk i component:
const { data: clients, isLoading, error, refetch } = useClients();
```

---

### 2. **Mutation Pattern** (For CREATE, UPDATE, DELETE)

**Template for mutations:**
```typescript
export function useCreateClient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (client: CreateClientInput) => {
      const { data, error } = await supabase
        .from('clients')
        .insert(client)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate caches to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Klient opprettet');
    },
    onError: (error) => {
      toast.error('Kunne ikke opprette klient');
      console.error('Create client error:', error);
    }
  });
}

// Bruk i component:
const createClient = useCreateClient();

const handleCreate = async () => {
  await createClient.mutateAsync({
    name: 'Ny klient',
    org_number: '123456789'
  });
};
```

---

### 3. **Filter & Search Pattern**

For komplekse filtre og søk, bruk `useMemo` og dedicated filter hooks.

**Eksempel: `useTemplateFilters.ts`**
```typescript
export function useTemplateFilters<T extends TemplateBase>(
  templates: T[], 
  options: Options = {}
) {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  
  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      const matchesSearch = !searchTerm || 
        template.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRisk = riskFilter === 'all' || 
        template.risk_level === riskFilter;
      
      return matchesSearch && matchesRisk;
    });
  }, [templates, searchTerm, riskFilter]);
  
  return {
    searchTerm,
    setSearchTerm,
    riskFilter,
    setRiskFilter,
    filteredTemplates
  };
}
```

---

## 📚 Viktige Hooks

### Client Management

#### `useClients()`
Henter alle klienter for innlogget bruker.

```typescript
import { useClients } from '@/hooks/useClients';

function ClientList() {
  const { data: clients, isLoading, error } = useClients();
  
  if (isLoading) return <Skeleton />;
  if (error) return <Alert variant="destructive">Feil</Alert>;
  
  return clients.map(client => <ClientCard key={client.id} client={client} />);
}
```

**RLS:** Filtrerer automatisk på `user_id = auth.uid()`

---

### Accounting Data

#### `useAccountingVersions(clientId: string)`
Henter alle regnskapsversjoner for en klient.

```typescript
import { useAccountingVersions } from '@/hooks/useAccountingVersions';

function VersionManager({ clientId }: { clientId: string }) {
  const { data: versions, isLoading } = useAccountingVersions(clientId);
  
  return versions?.map(v => (
    <div key={v.id}>
      Versjon {v.version_number} - {v.file_name}
      {v.is_active && <Badge>Aktiv</Badge>}
    </div>
  ));
}
```

**Relaterte hooks:**
- `useActiveVersion(clientId)` - Hent aktiv versjon
- `useCreateVersion()` - Opprett ny versjon (mutation)
- `useSetActiveVersion()` - Sett aktiv versjon (mutation)
- `useGLVersionOptions(clientId)` - Formatert for Select-komponenter

---

#### `useOptimizedAnalysis(input, options)`
Performance-optimert analyse med server-side caching (30 min).

```typescript
import { useOptimizedAnalysis } from '@/hooks/useOptimizedAnalysis';

function AnalysisDashboard({ clientId }: { clientId: string }) {
  const { data: analysis, isLoading, refetch } = useOptimizedAnalysis(
    { clientId },
    { staleTime: 5 * 60 * 1000 } // 5 min cache
  );
  
  if (!analysis) return null;
  
  return (
    <div>
      <h2>Transaksjoner: {analysis.total_transactions}</h2>
      <p>Periode: {analysis.date_range.start} - {analysis.date_range.end}</p>
      <p>Balansert: {analysis.trial_balance_crosscheck.balanced ? 'Ja' : 'Nei'}</p>
      
      {/* Data quality warnings */}
      {analysis.data_quality_flags.map(flag => (
        <Alert key={flag.code} variant={flag.severity}>
          {flag.code}: {flag.count} problemer
        </Alert>
      ))}
    </div>
  );
}
```

**Avanserte bruk:**
- `useRunOptimizedAnalysis()` - On-demand mutation
- `useBatchOptimizedAnalysis()` - Batch-analyse for flere klienter
- `useAnalysisMetrics(analysis)` - Beregnede metrikker

**Cache strategi:**
- Server-side: 30 minutter (PostgreSQL function)
- Client-side: 5 minutter (React Query)
- Invalideres automatisk ved ny data-versjon

---

### Audit Actions

#### `useAuditActionTemplates(subjectArea?)`
Henter audit action templates, filtrert på fagområde.

```typescript
import { 
  useAuditActionTemplates,
  useCreateAuditActionTemplate 
} from '@/hooks/audit-actions/useActionTemplateCRUD';

function TemplateLibrary() {
  const { data: templates } = useAuditActionTemplates('financial_statement_audit');
  const createTemplate = useCreateAuditActionTemplate();
  
  const handleCreate = async () => {
    await createTemplate.mutateAsync({
      name: 'Ny revisionshandling',
      subject_area: 'financial_statement_audit',
      risk_level: 'medium',
      procedures: 'Detaljerte prosedyrer...',
      applicable_phases: ['planning', 'execution']
    });
  };
  
  return <TemplateGrid templates={templates} onCreate={handleCreate} />;
}
```

**Relaterte hooks:**
- `useUpdateAuditActionTemplate()` - Oppdater template
- `useDeleteAuditActionTemplate()` - Slett template
- `useTemplateFilters(templates, options)` - Filtrer templates

---

### Knowledge Base

#### `useDocumentSearch(query, options)`
Søk i knowledge base med AI-drevne embeddings.

```typescript
import { useDocumentSearch } from '@/hooks/useDocumentSearch';

function KnowledgeSearch() {
  const [query, setQuery] = useState('');
  const { data: results, isLoading } = useDocumentSearch(query, {
    matchThreshold: 0.7,
    matchCount: 10
  });
  
  return (
    <div>
      <Input 
        value={query} 
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Søk i knowledge base..."
      />
      
      {results?.map(doc => (
        <Card key={doc.id}>
          <h3>{doc.title}</h3>
          <p>Relevans: {(doc.similarity * 100).toFixed(1)}%</p>
        </Card>
      ))}
    </div>
  );
}
```

**Relaterte hooks:**
- `useSubjectAreas()` - Hent fagområder
- `useTags()` - Hent tags for kategorisering
- `useContentTypes()` - Hent innholdstyper

---

### Utility Hooks

#### `useDebounce<T>(value: T, delay: number)`
Debounce input for å redusere antall API-kall.

```typescript
import { useDebounce } from '@/hooks/useDebounce';

function SearchInput() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  
  const { data } = useQuery({
    queryKey: ['search', debouncedSearch],
    queryFn: () => searchAPI(debouncedSearch),
    enabled: debouncedSearch.length > 2
  });
  
  return <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />;
}
```

---

#### `useBreakpoint()`
Sjekk skjermstørrelse for responsive design.

```typescript
import { useBreakpoint } from '@/hooks/useBreakpoint';

function ResponsiveLayout() {
  const { lg } = useBreakpoint(); // lg = >= 1024px
  
  return lg ? <DesktopLayout /> : <MobileLayout />;
}
```

---

#### `useIsMobile()`
Enklere mobil-deteksjon (< 768px).

```typescript
import { useIsMobile } from '@/hooks/use-mobile';

function AdaptiveMenu() {
  const isMobile = useIsMobile();
  
  return isMobile ? <MobileMenu /> : <DesktopMenu />;
}
```

---

## 🏗️ Hvordan Lage Nye Hooks

### Steg 1: Velg Pattern

**Data fetching?** → React Query (`useQuery`)\\
**Data mutation?** → React Query (`useMutation`)\\
**UI state?** → `useState` + `useMemo`\\
**Side effects?** → `useEffect`

---

### Steg 2: Følg Naming Convention

```
use[Entity][Action?].ts

Eksempler:
- useClients.ts           # Henter clients
- useCreateClient.ts      # Oppretter client
- useClientFilter.ts      # Filtrer clients
- useClientRoles.ts       # Henter client roles
```

---

### Steg 3: Template for React Query Hook

```typescript
// src/hooks/useMyEntity.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type MyEntity = {
  id: string;
  name: string;
  // ... other fields
};

// ===== READ =====
export function useMyEntities() {
  return useQuery({
    queryKey: ['my-entities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('my_entities')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as MyEntity[];
    }
  });
}

// ===== CREATE =====
export function useCreateMyEntity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (entity: Omit<MyEntity, 'id'>) => {
      const { data, error } = await supabase
        .from('my_entities')
        .insert(entity)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-entities'] });
      toast.success('Entity created');
    },
    onError: (error) => {
      toast.error('Failed to create entity');
      console.error('Create error:', error);
    }
  });
}

// ===== UPDATE =====
export function useUpdateMyEntity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MyEntity> & { id: string }) => {
      const { data, error } = await supabase
        .from('my_entities')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-entities'] });
      toast.success('Entity updated');
    }
  });
}

// ===== DELETE =====
export function useDeleteMyEntity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('my_entities')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-entities'] });
      toast.success('Entity deleted');
    }
  });
}
```

---

### Steg 4: Dokumenter Med JSDoc

```typescript
/**
 * Fetches all entities for the current user
 * 
 * @returns Query result with entity data
 * @throws Error if user is not authenticated
 * 
 * @example
 * ```tsx
 * function EntityList() {
 *   const { data: entities, isLoading } = useMyEntities();
 *   
 *   if (isLoading) return <Skeleton />;
 *   
 *   return entities?.map(e => <EntityCard key={e.id} entity={e} />);
 * }
 * ```
 */
export function useMyEntities() {
  // ...
}
```

---

## 🔒 RLS & Security

**VIKTIG:** Alle hooks som fetcher data må respektere RLS policies.

### ✅ RLS-vennlige patterns

```typescript
// Automatisk filtrering på user_id via RLS
const { data } = useQuery({
  queryKey: ['clients'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('*');  // RLS filtrerer automatisk
    
    if (error) throw error;
    return data;
  }
});
```

### ❌ Anti-patterns

```typescript
// ❌ IKKE hardkod user_id i query - bruk RLS!
const { data: user } = await supabase.auth.getUser();
const { data } = await supabase
  .from('clients')
  .select('*')
  .eq('user_id', user.id);  // Unødvendig - RLS gjør dette
```

Se [Database Architecture](../database/README.md#row-level-security-rls) for detaljer.

---

## ⚡ Performance Best Practices

### 1. **Bruk `staleTime` fornuftig**

```typescript
// Default: 0 (alltid refetch)
useQuery({ queryKey: ['data'], queryFn: fetchData });

// Cache i 5 minutter
useQuery({ 
  queryKey: ['data'], 
  queryFn: fetchData,
  staleTime: 5 * 60 * 1000 
});

// Infinite cache (kun for statiske data)
useQuery({ 
  queryKey: ['constants'], 
  queryFn: fetchConstants,
  staleTime: Infinity 
});
```

---

### 2. **Batch relaterte invalidations**

```typescript
onSuccess: () => {
  // ✅ BATCHER automatisk
  queryClient.invalidateQueries({ queryKey: ['clients'] });
  queryClient.invalidateQueries({ queryKey: ['client-stats'] });
  queryClient.invalidateQueries({ queryKey: ['recent-clients'] });
}
```

---

### 3. **Bruk `enabled` for conditional fetching**

```typescript
const { data: client } = useClient(clientId);

const { data: versions } = useAccountingVersions(clientId, {
  enabled: !!clientId  // Kun fetch når clientId finnes
});
```

---

### 4. **Optimistic updates for bedre UX**

```typescript
export function useUpdateClient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateClientAPI,
    onMutate: async (updatedClient) => {
      // Avbryt pågående fetches
      await queryClient.cancelQueries({ queryKey: ['clients'] });
      
      // Snapshot av gammel data
      const previousClients = queryClient.getQueryData(['clients']);
      
      // Optimistic update
      queryClient.setQueryData(['clients'], (old: Client[]) =>
        old.map(c => c.id === updatedClient.id ? updatedClient : c)
      );
      
      return { previousClients };
    },
    onError: (err, variables, context) => {
      // Rollback ved feil
      queryClient.setQueryData(['clients'], context?.previousClients);
    },
    onSettled: () => {
      // Alltid refetch til slutt
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    }
  });
}
```

---

## 🔗 Relaterte Guider

- **[Database Architecture](../database/README.md)** - Tabell-struktur og RLS
- **[Components Inventory](../components/README.md)** - UI-komponenter som bruker hooks
- **[Utilities Inventory](../utilities/README.md)** - Helper-funksjoner
- **[Project Overview](../gpt5-dev-kit/project-overview.md)** - Teknisk stack

---

## 🎓 Eksempler Fra Kodebasen

### Eksempel 1: Client Management Flow

```typescript
// 1. Hent klienter
const { data: clients } = useClients();

// 2. Opprett ny klient
const createClient = useCreateClient();
await createClient.mutateAsync({
  name: 'Ny AS',
  org_number: '987654321'
});

// 3. Oppdater klient
const updateClient = useUpdateClient();
await updateClient.mutateAsync({
  id: client.id,
  name: 'Oppdatert navn'
});

// 4. Slett klient
const deleteClient = useDeleteClient();
await deleteClient.mutateAsync(client.id);
```

---

### Eksempel 2: Accounting Version Workflow

```typescript
// 1. Hent versjoner
const { data: versions } = useAccountingVersions(clientId);

// 2. Opprett ny versjon
const createVersion = useCreateVersion();
const newVersion = await createVersion.mutateAsync({
  clientId,
  fileName: 'Hovedbok 2024.xlsx',
  totalTransactions: 1500,
  totalDebitAmount: 5000000,
  totalCreditAmount: 5000000,
  balanceDifference: 0
});

// 3. Aktiver versjon
const setActive = useSetActiveVersion();
await setActive.mutateAsync(newVersion.id);

// 4. Hent aktiv versjon
const { data: activeVersion } = useActiveVersion(clientId);
```

---

### Eksempel 3: Search & Filter

```typescript
function TemplateLibrary() {
  const { data: templates } = useAuditActionTemplates();
  
  const {
    searchTerm,
    setSearchTerm,
    riskFilter,
    setRiskFilter,
    filteredTemplates
  } = useTemplateFilters(templates || [], {
    selectedArea: 'financial_statement_audit'
  });
  
  return (
    <div>
      <Input 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Søk..."
      />
      
      <Select value={riskFilter} onValueChange={setRiskFilter}>
        <SelectItem value="all">Alle</SelectItem>
        <SelectItem value="high">Høy risiko</SelectItem>
        <SelectItem value="medium">Middels risiko</SelectItem>
        <SelectItem value="low">Lav risiko</SelectItem>
      </Select>
      
      <TemplateGrid templates={filteredTemplates} />
    </div>
  );
}
```

---

## 📋 Checklist for Nye Hooks

- [ ] Følg naming convention (`use[Entity][Action].ts`)
- [ ] Bruk React Query for data fetching
- [ ] Implementer proper error handling
- [ ] Invalidate relevante caches etter mutations
- [ ] Dokumenter med JSDoc og eksempler
- [ ] Test RLS policies fungerer
- [ ] Legg til TypeScript types
- [ ] Optimaliser `staleTime` og `enabled`
- [ ] Implementer toast notifications for mutations
- [ ] Oppdater denne dokumentasjonen

---

**Neste steg:**
- [Les om Database Architecture](../database/README.md)
- [Utforsk Components som bruker disse hooks](../components/README.md)
- [Se Project Overview for teknisk stack](../gpt5-dev-kit/project-overview.md)
