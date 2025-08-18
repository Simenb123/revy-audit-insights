# Revio Development Assistant - GPT-5 Project Kit

## Prosjektbeskrivelse
Revio er en omfattende norsk revisjonsplattform som strømlinjeliner revisors arbeid gjennom AI-drevne analyser, dokumenthåndtering og klientadministrasjon. Assistenten "Revy" hjelper revisorer med veiledning, filanalyse og automatisering av repetitive oppgaver.

## Teknisk Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS med semantiske tokens + shadcn/ui komponenter
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **AI Integration**: OpenAI GPT-4/5 via Supabase Edge Functions
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod validation

## Kjernefunksjonalitet
### 1. AI-Revy Assistant
- Kontekstbevisst chat for revisorspørsmål
- Dokumentanalyse og kategorisering
- Automatisk forslag og handlinger

### 2. Klientadministrasjon
- Komplett klientdatabase med BRREG-integrasjon
- Team- og tilgangsstyring per klient
- Historikk og endringslogging

### 3. Dokumenthåndtering
- Bulk upload og AI-kategorisering
- Tekstekstraksjon fra PDF/Excel
- Automatisk analyse og sammendrag

### 4. Revisjonshandlinger
- Strukturerte handlingsmaler og områder
- Progresjonssporing og rapportering
- Teamsamarbeid og kommentarer

### 5. Regnskapsdata
- Import fra Excel/CSV/SAF-T
- Hovedbok, balanse og resultatanalyse
- Journalposter og bilagsbehandling

## Utviklingsretningslinjer

### Design System
```css
/* Bruk ALLTID semantiske tokens fra index.css */
--primary: 262 83% 58%           /* Lilla hovedfarge */
--secondary: 210 40% 98%         /* Lys bakgrunn */
--accent: 262 83% 58%            /* Accent farge */
--muted: 210 40% 96%             /* Dempet bakgrunn */
--border: 214 32% 91%            /* Border farge */
```

### Komponentstruktur
```
src/components/
  [Domain]/                      # f.eks. Clients, AI, Knowledge
    [FeatureName]/              # f.eks. ClientList, RevyChat
      index.tsx                 # Hovedkomponent
      types.ts                  # TypeScript interfaces
      hooks/                    # Domene-spesifikke hooks
      components/               # Sub-komponenter
```

### Naming Conventions
- **Komponenter**: PascalCase på engelsk (ClientList, RevyChat)
- **Filer**: kebab-case (client-list.tsx, revy-chat.tsx)
- **Variabler/funksjoner**: camelCase på engelsk
- **UI tekst**: Norsk (labels, buttons, meldinger)
- **Database**: snake_case (client_documents, revy_sessions)

### Standard Imports
```typescript
import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
```

### Error Handling Pattern
```typescript
try {
  const { data, error } = await supabase.from('table').select();
  if (error) throw error;
  return data;
} catch (error) {
  logger.error('Error description:', error);
  toast({
    title: "Feil",
    description: "Beskrivelse på norsk",
    variant: "destructive",
  });
}
```

### Supabase Patterns
- **Queries**: Bruk React Query for caching
- **Mutations**: Invalidate relevante queries
- **RLS**: Alle tabeller skal ha Row Level Security
- **Edge Functions**: CORS headers og proper error handling

## AI Integration Guidelines
- Bruk `revy-ai-chat` edge function for hovedassistent
- Dokumentanalyse via `document-ai-analyzer`
- Lagre AI-interaksjoner i `ai_usage_logs` for statistikk
- Implementer loading states og error boundaries

## Responsive Design
- Mobile-first approach
- Bruk Tailwind responsive prefixes (sm:, md:, lg:)
- Test på minimum 320px bredde
- Prioriter touch-friendly interface

## Performance
- Lazy load komponenter med React.lazy()
- Implementer virtualisering for store lister
- Optimaliser Supabase queries med select()
- Bruk React Query for intelligent caching

## Accessibility
- Semantisk HTML struktur
- ARIA labels på norsk
- Keyboard navigation support
- Kontrast ratio minimum 4.5:1

## Testing Strategy (når relevant)
- Unit tests med Vitest
- Component tests med React Testing Library
- E2E tests for kritiske brukerflows
- Mock Supabase responses i tester