# Revio Naming Conventions

## Generelle Prinsipper
- **Teknisk kode**: Engelsk for konsistens og vedlikehold
- **UI/UX tekst**: Norsk for brukeropplevelse
- **Kommentarer**: Norsk for bedre forståelse blant norske utviklere
- **Variabler**: Beskrivende navn som forklarer formålet

## Fil og Mappe Struktur

### Komponenter
```
src/components/
  Clients/                    # Domene (PascalCase)
    ClientList/              # Feature (PascalCase)  
      index.tsx              # Hovedkomponent
      ClientList.tsx         # Samme navn som mappe
      types.ts               # TypeScript interfaces
      hooks/                 # Feature-spesifikke hooks
        useClientList.ts
        useClientMutation.ts
      components/            # Sub-komponenter
        ClientCard.tsx
        ClientFilter.tsx
    ClientDetails/
      index.tsx
      ClientDetails.tsx
```

### Hooks
```
src/hooks/
  useLocalStorage.ts         # Generelle hooks (camelCase)
  useAIUsage.ts
  useClientData.ts
```

### Services og Utils
```
src/services/
  revy/                      # Service domene
    revyService.ts
    types.ts
  knowledge/
    knowledgeService.ts

src/utils/
  logger.ts                  # Utility funksjoner
  formatters.ts
  validators.ts
```

## TypeScript Conventions

### Interfaces og Types
```typescript
// Interfaces - PascalCase med beskrivende navn
interface ClientData {
  id: string;
  companyName: string;        // camelCase for properties
  orgNumber: string;
  createdAt: string;
}

// Props interfaces - ComponentName + Props
interface ClientListProps {
  clients: ClientData[];
  onClientSelect: (client: ClientData) => void;
}

// API response types - include Response suffix
interface ClientApiResponse {
  data: ClientData[];
  total: number;
  page: number;
}

// Form data types - include Data suffix  
interface CreateClientData {
  companyName: string;
  orgNumber: string;
  contactEmail: string;
}

// Enums - PascalCase
enum ClientStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending'
}
```

### Funksjoner og Variabler
```typescript
// Funksjoner - camelCase, verb-basert
const fetchClientData = async (clientId: string) => { };
const validateOrgNumber = (orgNumber: string) => { };
const handleClientUpdate = (data: ClientData) => { };

// Variabler - camelCase, beskrivende
const clientList = data?.clients || [];
const isLoadingClients = query.isLoading;
const hasSelectedClient = !!selectedClient;

// Konstanter - UPPER_SNAKE_CASE
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_PAGE_SIZE = 50;
const API_ENDPOINTS = {
  CLIENTS: '/api/clients',
  DOCUMENTS: '/api/documents'
};
```

### Hook Naming
```typescript
// Data fetching hooks - use + DataType
const useClientData = (clientId: string) => { };
const useDocumentList = (filters: DocumentFilter) => { };
const useAIUsageStats = (timeframe: string) => { };

// Mutation hooks - use + Action + DataType  
const useCreateClient = () => { };
const useUpdateDocument = () => { };
const useDeleteAction = () => { };

// UI state hooks - use + Purpose
const useFormValidation = (schema: ZodSchema) => { };
const useTablePagination = (totalItems: number) => { };
const useModalState = () => { };
```

## Component Naming

### Komponent filer
```typescript
// Hovedkomponenter - PascalCase
ClientList.tsx
RevyChat.tsx
DocumentUploader.tsx

// Sub-komponenter - beskrivende navn
ClientCard.tsx
ChatMessage.tsx
UploadProgress.tsx

// Layout komponenter - include Layout
ClientListLayout.tsx
DashboardLayout.tsx

// Modal/Dialog komponenter - include Modal/Dialog
CreateClientDialog.tsx
DeleteConfirmationModal.tsx
```

### Komponent Props
```typescript
// Props navn - beskrivende og konsistent
interface ComponentProps {
  // Data props
  data: DataType[];
  selectedItem: DataType | null;
  
  // Callback props - on + Action
  onItemSelect: (item: DataType) => void;
  onItemCreate: (data: CreateData) => void;
  onItemDelete: (id: string) => void;
  
  // State props - is/has + State
  isLoading?: boolean;
  hasError?: boolean;
  isVisible?: boolean;
  
  // Configuration props
  title?: string;
  placeholder?: string;
  maxItems?: number;
  
  // Style props
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}
```

## Database Naming (Supabase)

### Tabeller
```sql
-- snake_case for tabellnavn
clients
client_documents  
audit_actions
ai_usage_logs
knowledge_articles

-- Junction tables - table1_table2
client_team_members
action_attachments
```

### Kolonner
```sql
-- snake_case for kolonnenavn
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  org_number TEXT UNIQUE,
  contact_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_id UUID REFERENCES auth.users(id)
);

-- Timestamp konvensjoner
created_at    -- Når raden ble opprettet
updated_at    -- Når raden sist ble oppdatert  
deleted_at    -- Soft delete timestamp
processed_at  -- Når prosessering ble fullført
expires_at    -- Når data utløper
```

### Edge Functions
```
-- kebab-case for funksjonsnavn
revy-ai-chat
document-ai-analyzer
client-data-import
generate-audit-report
```

## UI Text Conventions

### Norsk UI Tekst
```typescript
// Labels og buttons - norsk
"Opprett klient"
"Lagre endringer"  
"Last opp dokument"
"Analyser med AI"

// Status messages - norsk
"Laster data..."
"Dokumentet ble lastet opp"
"Feil ved lagring av data"

// Form labels - norsk med forklarende tekst
"Organisasjonsnummer *"
"E-post adresse (valgfri)"
"Velg revisjonsår"

// Table headers - norsk
"Klientnavn"
"Opprettet dato"
"Status"
"Handlinger"
```

### Error Messages
```typescript
// Tekniske feil - norsk forklaring
"Kunne ikke laste klientdata. Prøv igjen senere."
"Ugyldig organisasjonsnummer format."
"Filen er for stor (maks 10MB)."

// Validation errors - specifik norsk tekst
"Navn er påkrevd"
"E-post må være gyldig adresse"
"Passord må være minst 8 tegn"
```

## API og Service Naming

### Service Methods
```typescript
// CRUD operasjoner - engelsk verb + noun
clientService.createClient(data)
clientService.updateClient(id, data)  
clientService.deleteClient(id)
clientService.getClientById(id)
clientService.listClients(filters)

// Business logic - engelsk verb + context
revyService.analyzeDocument(documentId)
revyService.generateSuggestions(context)
auditService.calculateRiskScore(clientId)
```

### Query Keys (TanStack Query)
```typescript
// Hierarkisk struktur med domene først
['clients']                           // All clients
['clients', clientId]                 // Specific client  
['clients', clientId, 'documents']    // Client documents
['audit-actions', { clientId }]       // Audit actions for client
['ai-usage', { timeframe: 'week' }]   // AI usage stats
```

## CSS/Styling Conventions

### Tailwind Classes
```typescript
// Bruk semantiske tokens, ikke direkte farger
"bg-card text-card-foreground"        // ✅ Riktig
"bg-white text-black"                 // ❌ Unngå

// Responsive prefixes
"w-full md:w-1/2 lg:w-1/3"           // Mobil først
"text-sm md:text-base"               // Responsive font sizes

// Spacing consistency
"p-4 md:p-6"                         // Padding
"gap-4 md:gap-6"                     // Grid/flex gaps
"space-y-4"                          // Vertical spacing
```

### CSS Custom Properties
```css
/* Design tokens - norsk beskrivelse i kommentarer */
:root {
  --primary: 262 83% 58%;              /* Hovedfarge - lilla */
  --secondary: 210 40% 98%;            /* Sekundær bakgrunn */
  --accent: 262 83% 58%;               /* Accent farge */
  --muted: 210 40% 96%;                /* Dempet bakgrunn */
  
  /* App-spesifikke tokens */
  --header-height: 64px;               /* Header høyde */
  --sidebar-width: 280px;              /* Sidebar bredde */
}
```

## Commit Message Conventions
```
feat: legg til klient opprettelse workflow
fix: løs problem med AI document analyse  
docs: oppdater API dokumentasjon
style: forbedre responsive design for mobilvisning
refactor: restrukturerer client service
test: legg til tester for document upload
```