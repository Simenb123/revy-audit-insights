# Revio Developer Onboarding Guide

Velkommen til Revio! Denne guiden hjelper deg raskt i gang med utviklingen.

---

## 🚀 Quick Start

### 1. Kjør prosjektet lokalt
```bash
npm install
npm run dev
```

Applikasjonen kjører på `http://localhost:5173`

---

### 2. Forstå arkitekturen

Revio er bygget med:
- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS + shadcn/ui
- **Backend:** Supabase (PostgreSQL + Edge Functions)
- **State:** TanStack Query (React Query)
- **Routing:** React Router v6

**Mappestruktur:**
```
src/
├── components/          # Alle UI-komponenter
│   ├── ui/             # shadcn/ui komponenter + StandardDataTable
│   ├── AI/             # AI-Revy assistant
│   ├── Clients/        # Klient-relaterte komponenter
│   ├── Layout/         # Layout-komponenter (headers, navigation)
│   └── ...
├── pages/              # Route-sider
├── hooks/              # Custom React hooks
├── utils/              # Utility-funksjoner (fileProcessing, formatters, etc.)
├── types/              # TypeScript types
├── integrations/       # Supabase client og types
└── lib/                # Third-party lib configs
```

---

## 📚 Essential Documentation

**Les disse FØRST:**
1. **[Components Inventory](./components/README.md)** - Alle gjenbrukbare komponenter
2. **[Utilities Inventory](./utilities/README.md)** - Alle utilities og helpers
3. **[Project Overview](./gpt5-dev-kit/project-overview.md)** - Teknisk stack og guidelines

**Viktige guides:**
- **[StandardDataTable](./components/data-tables.md)** - Vår primære tabell-komponent (brukt 17+ steder)
- **[File Processing](./utilities/file-processing.md)** - Excel/CSV upload-system (brukt 17+ steder)
- **[PivotWidget](./components/pivot-widget.md)** - Interaktiv pivot-analyse
- **[Page Layout](./page-layout.md)** - Layout-komponenter og subheader-styling
- **[Color Palette](./color-palette.md)** - Revio fargeskjema

---

## 🎯 "Don't Reinvent the Wheel" - Gjenbruk Liste

**Før du koder, SJEKK OM DET ALLEREDE FINNES:**

### Vanlige oppgaver og eksisterende løsninger

| Oppgave | Løsning | Dokumentasjon |
|---------|---------|---------------|
| Lage en tabell med data | `StandardDataTable` | [Guide](./components/data-tables.md) |
| Upload Excel/CSV | `fileProcessing.ts` + `createFieldDefinitions` | [Guide](./utilities/file-processing.md) |
| Pivot-analyse | `PivotWidget` | [Guide](./components/pivot-widget.md) |
| Formatere valuta | `formatCurrency()` | [Utilities](./utilities/README.md#formatters) |
| Formatere dato | `formatDate()` | [Utilities](./utilities/README.md#date--time) |
| Export til Excel | `StandardDataTable` har built-in export | [Guide](./components/data-tables.md) |
| Export til PDF | `StandardDataTable` har built-in export | [Guide](./components/data-tables.md) |
| Hente data fra Supabase | `useQuery` pattern | [Utilities](./utilities/README.md#api--supabase) |
| Page layout | `StandardPageLayout` | [Guide](./page-layout.md) |
| Subheader | `GlobalSubHeader`, `ClientSubHeader` | [Guide](./page-layout.md#subheader-styling) |
| Loading state | `Skeleton` komponent | [Components](./components/README.md) |
| Error handling | `logger` + `useToast` | [Utilities](./utilities/README.md#logging--debugging) |
| Form validation | Zod schemas | [Utilities](./utilities/README.md#validation) |

---

## 🎨 Design System Guidelines

### Bruk ALLTID semantiske tokens

**❌ GJØR IKKE:**
```tsx
<div className="bg-white text-black">
```

**✅ GJØR:**
```tsx
<div className="bg-background text-foreground">
```

**CSS Variabler (fra index.css):**
```css
--primary: 262 83% 58%      /* Lilla hovedfarge */
--revio-500: #2A9D8F         /* Revio-green (header, subheader) */
--background: 0 0% 100%      /* Hvit */
--foreground: 222 47% 11%    /* Mørk tekst */
--muted: 210 40% 96%         /* Dempet bakgrunn */
--border: 214 32% 91%        /* Border farge */
```

**Tailwind Classes:**
- `bg-revio-500` - Revio-green (header, subheader)
- `bg-background` - Hvit bakgrunn
- `text-foreground` - Primær tekstfarge
- `text-muted-foreground` - Dempet tekstfarge
- `border-border` - Standard border

**Se fullstendig palette:** [Color Palette Guide](./color-palette.md)

---

### Layout Guidelines

**Subheaders MÅ bruke Revio-green:**
```tsx
<GlobalSubHeader
  title="Min Side"
  actions={<Button>Legg til</Button>}
/>
```

**Standard page layout:**
```tsx
import { StandardPageLayout } from '@/components/Layout/StandardPageLayout';

<StandardPageLayout spacing="comfortable">
  <Section title="Min Seksjon">
    <p>Innhold her</p>
  </Section>
</StandardPageLayout>
```

**Se fullstendig guide:** [Page Layout Guide](./page-layout.md)

---

## 🛠️ Development Workflow

### 1. Før du starter en task:
- [ ] Les relevante dokumenter fra denne guiden
- [ ] Sjekk om komponenten/utility allerede finnes
- [ ] Se hvordan lignende features er implementert andre steder
- [ ] Diskuter approach med teamet hvis usikker

### 2. Under utvikling:
- [ ] Følg TypeScript types strengt
- [ ] Bruk design tokens (ikke hardkodede farger)
- [ ] Test responsivt design (mobil først)
- [ ] Håndter loading states og errors
- [ ] Bruk logger for debugging

### 3. Før du committer:
- [ ] Test på mobil og desktop
- [ ] Sjekk console for errors/warnings
- [ ] Verifiser at eksisterende funksjonalitet fortsatt virker
- [ ] Dokumenter nye komponenter/utilities i relevante README-filer

---

## 📖 Code Examples

### Fetch data fra Supabase
```tsx
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*');
      if (error) throw error;
      return data;
    },
  });
}
```

### Lage en tabell
```tsx
import { StandardDataTable } from '@/components/ui/standard-data-table';

const columns = [
  {
    key: 'name',
    label: 'Navn',
    isSortable: true,
  },
  {
    key: 'email',
    label: 'E-post',
    isSortable: true,
  },
];

<StandardDataTable
  data={clients}
  columns={columns}
  searchKeys={['name', 'email']}
  enableExport
/>
```

### Upload Excel-fil
```tsx
import { processExcelFile, createFieldDefinitions } from '@/utils/fileProcessing';

const fields = createFieldDefinitions([
  { key: 'name', label: 'Navn', required: true },
  { key: 'email', label: 'E-post', type: 'email' },
]);

const handleFileUpload = async (file: File) => {
  try {
    const { data, errors } = await processExcelFile(file, fields);
    if (errors.length > 0) {
      console.error('Import errors:', errors);
    }
    // Lagre data til Supabase
  } catch (error) {
    logger.error('File upload failed:', error);
  }
};
```

### Error handling pattern
```tsx
import { logger } from '@/utils/logger';
import { useToast } from '@/hooks/use-toast';

const { toast } = useToast();

try {
  const { data, error } = await supabase
    .from('clients')
    .insert(newClient);
  
  if (error) throw error;
  
  toast({
    title: "Suksess",
    description: "Klient opprettet",
  });
} catch (error) {
  logger.error('Failed to create client:', error);
  toast({
    title: "Feil",
    description: "Kunne ikke opprette klient",
    variant: "destructive",
  });
}
```

---

## 🎓 Learning Resources

### Teknologier å lære
1. **React 18** - https://react.dev/
2. **TypeScript** - https://www.typescriptlang.org/docs/
3. **Tailwind CSS** - https://tailwindcss.com/docs
4. **TanStack Query** - https://tanstack.com/query/latest
5. **Supabase** - https://supabase.com/docs
6. **shadcn/ui** - https://ui.shadcn.com/

### Revio-spesifikke konsepter
- **Regnskapsdata:** Hovedbok, balanse, resultat, journalposter
- **Revisjonshandlinger:** Strukturerte handlingsmaler per område
- **AI-Revy:** Kontekstbevisst assistant for revisorer
- **BRREG-integrasjon:** Automatisk firmaoppslagsdata
- **SAF-T format:** Norsk standard for regnskapsdata

---

## 🐛 Debugging Tips

### Console errors?
```tsx
import { logger } from '@/utils/logger';

// Bruk logger for bedre debugging
logger.info('Component mounted', { componentName: 'MyComponent' });
logger.error('API call failed', error);
```

### Supabase query feil?
```tsx
// Alltid sjekk for error
const { data, error } = await supabase.from('table').select();
if (error) {
  logger.error('Supabase error:', error);
  console.error('Full error:', error);
  throw error;
}
```

### Styling issues?
- Sjekk at du bruker design tokens (ikke hardkodede verdier)
- Verifiser at Tailwind classes er korrekte
- Test i både light og dark mode
- Bruk browser DevTools for å inspisere CSS

---

## 🤝 Team Collaboration

### Git Workflow
```bash
# Hent siste endringer
git pull origin main

# Lag ny branch
git checkout -b feature/my-feature

# Commit ofte med beskrivende meldinger
git commit -m "feat: Add client export functionality"

# Push og lag PR
git push origin feature/my-feature
```

### Code Review Checklist
- [ ] Følger kodestandard og naming conventions
- [ ] TypeScript types definert korrekt
- [ ] Error handling implementert
- [ ] Loading states håndtert
- [ ] Responsive design testet
- [ ] Eksisterende funksjonalitet fortsatt virker
- [ ] Nye komponenter dokumentert i README-filer

---

## 📞 Need Help?

1. **Sjekk dokumentasjonen først** - Svaret er sannsynligvis her
2. **Se hvordan det er gjort andre steder** - Finn lignende komponenter
3. **Spør teamet** - Vi hjelper gjerne!
4. **Logg issues** - Dokumenter bugs og feature requests

---

## ✅ Checklist for ny utvikler

**Dag 1:**
- [ ] Kjør prosjektet lokalt
- [ ] Les denne guiden
- [ ] Les [Components Inventory](./components/README.md)
- [ ] Les [Utilities Inventory](./utilities/README.md)
- [ ] Utforsk kodebasen

**Uke 1:**
- [ ] Les [StandardDataTable Guide](./components/data-tables.md)
- [ ] Les [File Processing Guide](./utilities/file-processing.md)
- [ ] Les [Project Overview](./gpt5-dev-kit/project-overview.md)
- [ ] Gjør en liten bugfix eller feature
- [ ] Få code review fra teamet

**Måned 1:**
- [ ] Forstå hovedkonseptene (revisjonshandlinger, regnskapsdata, AI-Revy)
- [ ] Bidra til større features
- [ ] Begynn å reviewe andres kode
- [ ] Foreslå forbedringer

---

**Velkommen til teamet! 🎉**

**Sist oppdatert:** 2025-01-10  
**Vedlikeholdes av:** Revio Development Team
