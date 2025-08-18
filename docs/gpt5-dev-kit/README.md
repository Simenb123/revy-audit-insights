# Revio GPT-5 Development Kit

Dette development kit inneholder alt du trenger for å utvikle effektivt med GPT-5 Canvas for Revio revisionsplatformen.

## 📁 Kit Innhold

### 🏗️ Grunnleggende Setup
- **[project-overview.md](./project-overview.md)** - Komplett prosjektbeskrivelse og teknisk stack for GPT-5
- **[naming-conventions.md](./naming-conventions.md)** - Navnekonvensjoner for konsistent kodebase
- **[integration-patterns.md](./integration-patterns.md)** - Mønstre for AI, realtime og feilhåndtering

### 🧩 Komponent Templates
- **[component-templates/data-table-component.md](./component-templates/data-table-component.md)** - Template for data-tabeller med søk og sortering
- **[component-templates/form-component.md](./component-templates/form-component.md)** - Form komponenter med validering og mutations
- **[component-templates/ai-chat-component.md](./component-templates/ai-chat-component.md)** - AI chat integration med streaming

### 🗄️ Supabase Snippets
- **[supabase-snippets/database-queries.md](./supabase-snippets/database-queries.md)** - Standard query patterns og React Query integration
- **[supabase-snippets/edge-functions.md](./supabase-snippets/edge-functions.md)** - Edge Functions templates og AI integration

### 🎯 GPT-5 Prompts
- **[gpt5-prompts/specific-features.md](./gpt5-prompts/specific-features.md)** - Feature-spesifikke prompts for Canvas

## 🚀 Hvordan Bruke Kit'et

### 1. Setup GPT-5 Project
1. Kopier innholdet fra `project-overview.md` til et nytt ChatGPT project
2. Legg til som "Project instructions" i GPT-5
3. Upload relevante component templates som referansefiler

### 2. Utvikle Med Canvas
1. Velg relevant prompt fra `gpt5-prompts/` mappen
2. Tilpass prompt med spesifikke krav for din feature
3. Bruk Canvas for å iterere på komponenten
4. Kopier ferdig kode til Lovable når du er fornøyd

### 3. Integrasjon
1. Bruk snippets fra `supabase-snippets/` for database og AI integration
2. Følg patterns fra `integration-patterns.md` for større features
3. Hold deg til `naming-conventions.md` for konsistens

## 📋 Template Eksempel

Her er et komplett eksempel på hvordan du bruker en template:

```
🎯 KOPIER DENNE PROMPTEN TIL GPT-5 CANVAS:

Lag en React komponent for å vise klientens dokumentliste i Revio.

TEKNISKE KRAV:
- React 18 + TypeScript
- shadcn/ui Table komponenter  
- TanStack Query for data fetching
- Supabase client for backend
- Norsk UI tekst

FEATURES:
- Søk og filtrering på dokumentnavn
- Sortering på kolonner (navn, dato, størrelse)
- Bulk operasjoner (kategorisering, sletting)
- AI-analyse knapp per dokument
- Upload av nye dokumenter

DATA STRUKTUR:
- client_documents_files tabell
- Kolonner: id, file_name, file_size, created_at, category_id
- Relations: unified_categories for kategorier

SUPABASE:
- RLS aktivert (user_id basert tilgang)  
- Edge function: document-ai-analyzer

DESIGN:
- Responsive table med mobile-friendly layout
- Semantiske farger (bg-card, text-foreground, border)
- Loading states og error handling
- Drag & drop for file upload

Lag komplett komponent med types, hooks og error handling.
```

## 🎨 Design System Referanse

### Farger (Bruk Semantiske Tokens)
```css
/* ✅ Riktig måte */
className="bg-card text-card-foreground border-border"

/* ❌ Unngå direkte farger */
className="bg-white text-black border-gray-200"
```

### Responsive Design
```typescript
// Mobile-first responsive klasser
"w-full md:w-1/2 lg:w-1/3"
"text-sm md:text-base lg:text-lg"
"p-4 md:p-6 lg:p-8"
```

### Component Structure
```
MyComponent/
  index.tsx              // Re-export
  MyComponent.tsx        // Main component
  types.ts              // TypeScript interfaces
  hooks/                // Feature hooks
    useMyComponent.ts
  components/           // Sub-components
    MySubComponent.tsx
```

## 🔧 Debugging Tips

### Vanlige Problemer
1. **RLS Errors**: Sjekk at user_id er satt riktig i queries
2. **TypeScript Errors**: Bruk templates for konsistente interfaces
3. **Styling Issues**: Bruk semantiske tokens fra design system
4. **AI Integration**: Sjekk at context blir sendt riktig til edge functions

### Performance
1. Bruk React Query for caching
2. Implementer lazy loading for store komponenter
3. Optimaliser Supabase queries med select()
4. Bruk debouncing for søk-inputs

## 📚 Læringsressurser

- [Revio Project Overview](../../project-overview.md)
- [Supabase Docs](https://supabase.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [TanStack Query](https://tanstack.com/query/latest)
- [React Hook Form](https://react-hook-form.com/)

## 🤝 Bidrag

For å forbedre dette kit'et:
1. Test templates med GPT-5 Canvas
2. Dokumenter nye patterns du oppdager
3. Legg til flere feature-spesifikke prompts
4. Oppdater conventions basert på beste praksis

---

**Happy coding! 🎉**

*Dette kit'et er designet for å maksimere produktiviteten med GPT-5 Canvas for Revio-utviklingen.*