# Migreringsguide - Oppgradering til ny arkitektur

Guide for å oppgradere eksisterende kode til den nye refaktorerte arkitekturen.

---

## 📋 Innhold

1. [Oversikt](#oversikt)
2. [Breaking Changes](#breaking-changes)
3. [Komponent-migreringer](#komponent-migreringer)
4. [Hook-migreringer](#hook-migreringer)
5. [Utility-migreringer](#utility-migreringer)
6. [Common Pitfalls](#common-pitfalls)
7. [Testing Checklist](#testing-checklist)

---

## Oversikt

### Hva er endret?

- ✅ **Core components**: 4 nye gjenbrukbare komponenter
- ✅ **Unified phase handling**: Sentralisert i `auditPhases.ts`
- ✅ **Data-driven subject areas**: Fra database via `useSubjectAreaLabels`
- ✅ **Context API**: `AuditActionsContext` for global state
- ❌ **Deprecated**: 6 gamle komponenter erstattet

### Hvem påvirkes?

Alle som bruker:
- `FlexibleActionTemplateList`
- `EnhancedActionTemplateList`
- Hardkodet phase-mapping
- `SUBJECT_AREA_LABELS` constant
- Duplisert badge-logikk

---

## Breaking Changes

### 1. Phase-mapping funksjoner flyttet

**❌ GAMMEL KODE:**
```typescript
// Fra useAuditActions.ts eller lokale implementasjoner
import { mapPhaseToDb, mapPhaseFromDb } from '@/hooks/useAuditActions';

const dbPhase = mapPhaseToDb('completion');
```

**✅ NY KODE:**
```typescript
// Sentralisert i constants/auditPhases.ts
import { toDbPhase, fromDbPhase } from '@/constants/auditPhases';

const dbPhase = toDbPhase('completion'); // 'conclusion'
```

**Endringer:**
- ✅ Konsistent navngivning: `toDbPhase` / `fromDbPhase`
- ✅ Én kilde til sannhet
- ✅ Inkluderer full `PHASE_CONFIG` med labels, colors, icons

---

### 2. Subject Area Labels er nå dynamiske

**❌ GAMMEL KODE:**
```typescript
import { SUBJECT_AREA_LABELS } from '@/types/audit-actions';

const label = SUBJECT_AREA_LABELS['sales']; // 'Salg'
```

**✅ NY KODE:**
```typescript
import { useSubjectAreaLabels } from '@/hooks/audit-actions/useSubjectAreaLabels';

function MyComponent() {
  const { getLabel, labelMap } = useSubjectAreaLabels();
  
  const label = getLabel('sales'); // 'Salg' (fra database)
  // Eller: const label = labelMap['sales'];
}
```

**Fordeler:**
- ✅ Dynamiske fagområder per revisjonsfirma
- ✅ Støtte for ikoner og farger fra database
- ✅ Enkelt å legge til nye områder via admin

---

### 3. Badge-logikk konsolidert

**❌ GAMMEL KODE:**
```typescript
// Duplisert i mange komponenter
const getRiskBadgeColor = (riskLevel: string) => {
  switch (riskLevel) {
    case 'high': return 'destructive';
    case 'medium': return 'default';
    case 'low': return 'secondary';
    default: return 'outline';
  }
};
```

**✅ NY KODE:**
```typescript
import { getRiskBadgeVariant, getRiskLabel } from '@/components/AuditActions/core/badgeUtils';

const variant = getRiskBadgeVariant('high'); // 'destructive'
const label = getRiskLabel('high'); // 'Høy risiko'
```

---

## Komponent-migreringer

### FlexibleActionTemplateList → TemplateLibrary

**❌ GAMMEL KODE:**
```typescript
import { FlexibleActionTemplateList } from '@/components/AuditActions/FlexibleActionTemplateList';

<FlexibleActionTemplateList
  templates={templates}
  viewMode="basic"
  showFilters={true}
  onTemplateSelect={(t) => console.log(t)}
/>
```

**✅ NY KODE:**
```typescript
import { TemplateLibrary } from '@/components/AuditActions/TemplateLibrary';

<TemplateLibrary
  phase={phase}
  onCopyToClient={handleCopyToClient}
/>
```

**Endringer:**
- ❌ `templates` prop fjernet → henter selv fra database via `useAuditActionTemplates`
- ❌ `viewMode` fjernet → håndteres internt som state
- ❌ `showFilters` fjernet → alltid tilgjengelig
- ✅ Ny `phase` prop for filtering
- ✅ Ny `onCopyToClient` callback

**Migreringssteg:**
1. Fjern `templates` prop (TemplateLibrary henter selv)
2. Fjern `viewMode` state fra parent
3. Legg til `phase` prop hvis du vil pre-filtrere
4. Implementer `onCopyToClient` callback

---

### EnhancedActionTemplateList → TemplateLibrary

**❌ GAMMEL KODE:**
```typescript
import { EnhancedActionTemplateList } from '@/components/AuditActions/EnhancedActionTemplateList';

<EnhancedActionTemplateList
  templates={enhancedTemplates}
  onTemplateClick={(t) => setSelectedTemplate(t)}
/>
```

**✅ NY KODE:**
```typescript
import { TemplateLibrary } from '@/components/AuditActions/TemplateLibrary';

<TemplateLibrary
  phase={phase}
  onCopyToClient={handleCopyToClient}
/>
```

**Note:** `TemplateLibrary` inkluderer både basic og enhanced views internt.

---

### Custom Liste → ActionList + ActionCard

Hvis du har egen liste-komponent med duplisert logikk:

**❌ GAMMEL KODE:**
```typescript
function MyCustomList({ items }: { items: AuditActionTemplate[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  return (
    <div>
      {items.map(item => (
        <Card key={item.id}>
          <CardHeader>
            <h3>{item.name}</h3>
            <Badge variant={getRiskBadgeColor(item.risk_level)}>
              {item.risk_level}
            </Badge>
          </CardHeader>
          <CardContent>{item.description}</CardContent>
        </Card>
      ))}
    </div>
  );
}
```

**✅ NY KODE:**
```typescript
import { ActionList } from '@/components/AuditActions/core/ActionList';
import { ActionCard } from '@/components/AuditActions/core/ActionCard';

function MyCustomList({ items }: { items: AuditActionTemplate[] }) {
  return (
    <ActionList
      items={items}
      renderItem={(item) => (
        <ActionCard
          action={item}
          onSelect={() => console.log('Selected:', item.id)}
        />
      )}
      enableVirtualization={items.length > 50}
    />
  );
}
```

**Fordeler:**
- ✅ Virtualisering out-of-the-box
- ✅ Consistent badge-rendering
- ✅ Empty states automatisk
- ✅ Selection state håndteres av `AuditActionsContext`

---

### Badge-komponenter

**❌ GAMMEL KODE:**
```typescript
<Badge variant={getRiskBadgeColor(action.risk_level)}>
  {action.risk_level}
</Badge>
```

**✅ NY KODE:**
```typescript
import { getRiskBadgeVariant, getRiskLabel } from '@/components/AuditActions/core/badgeUtils';

<Badge variant={getRiskBadgeVariant(action.risk_level)}>
  {getRiskLabel(action.risk_level)}
</Badge>
```

---

## Hook-migreringer

### Phase-mapping i hooks

**❌ GAMMEL KODE:**
```typescript
import { useAuditActions } from '@/hooks/useAuditActions';

const { mapPhaseToDb, mapPhaseFromDb } = useAuditActions();
const dbPhase = mapPhaseToDb('completion');
```

**✅ NY KODE:**
```typescript
import { toDbPhase, fromDbPhase } from '@/constants/auditPhases';

const dbPhase = toDbPhase('completion'); // 'conclusion'
```

---

### Subject Area filtering

**❌ GAMMEL KODE:**
```typescript
const filteredTemplates = templates.filter(t => 
  SUBJECT_AREA_LABELS[t.subject_area]?.toLowerCase().includes(searchTerm)
);
```

**✅ NY KODE:**
```typescript
import { useSubjectAreaLabels } from '@/hooks/audit-actions/useSubjectAreaLabels';

const { getLabel } = useSubjectAreaLabels();

const filteredTemplates = templates.filter(t => 
  getLabel(t.subject_area).toLowerCase().includes(searchTerm)
);
```

---

## Utility-migreringer

### Phase Labels

**❌ GAMMEL KODE:**
```typescript
// Hardkodet mapping i komponent
const phaseLabel = phase === 'engagement' ? 'Engasjement' :
                   phase === 'planning' ? 'Planlegging' :
                   phase === 'execution' ? 'Utførelse' : phase;
```

**✅ NY KODE:**
```typescript
import { getPhaseLabel } from '@/constants/auditPhases';

const phaseLabel = getPhaseLabel(phase); // 'Planlegging'
```

---

### Phase Metadata

**❌ GAMMEL KODE:**
```typescript
// Ingen tilgang til metadata
const phaseColor = 'bg-blue-500'; // Hardkodet
```

**✅ NY KODE:**
```typescript
import { PHASE_CONFIG } from '@/constants/auditPhases';

const phaseConfig = PHASE_CONFIG[phase];
// { dbValue: 'planning', label: 'Planlegging', color: 'bg-blue-500', icon: FileTextIcon, ... }
```

---

## Common Pitfalls

### 1. Glemmer å oppdatere imports

**Problem:**
```typescript
// Gammel import fortsatt i bruk
import { SUBJECT_AREA_LABELS } from '@/types/audit-actions';
```

**Løsning:**
```typescript
// Erstatt med hook
import { useSubjectAreaLabels } from '@/hooks/audit-actions/useSubjectAreaLabels';
```

---

### 2. Phase-mapping i feil retning

**Problem:**
```typescript
// Forsøker å sende UI phase direkte til database
const { data } = await supabase
  .from('client_audit_actions')
  .select('*')
  .eq('phase', 'completion'); // ❌ Finnes ikke i DB!
```

**Løsning:**
```typescript
import { toDbPhase } from '@/constants/auditPhases';

const dbPhase = toDbPhase('completion'); // 'conclusion'
const { data } = await supabase
  .from('client_audit_actions')
  .select('*')
  .eq('phase', dbPhase); // ✅ Riktig!
```

---

### 3. Dupliserer fortsatt badge-logikk

**Problem:**
```typescript
// Lager egen getRiskColor-funksjon
const getRiskColor = (risk: string) => { /* ... */ };
```

**Løsning:**
```typescript
// Bruk eksisterende utility
import { getRiskBadgeVariant } from '@/components/AuditActions/core/badgeUtils';
```

---

### 4. Manuell selection state istedenfor context

**Problem:**
```typescript
// Hver komponent holder egen state
const [selectedIds, setSelectedIds] = useState<string[]>([]);
```

**Løsning:**
```typescript
// Bruk global context
import { useAuditActionsContext } from '@/contexts/AuditActionsContext';

const { selectedIds, toggleSelect, clearSelection } = useAuditActionsContext();
```

---

### 5. Forsøker å bruke deprecated komponenter

**Problem:**
```typescript
// Disse komponentene finnes ikke lenger
import { FlexibleActionTemplateList } from '@/components/AuditActions/FlexibleActionTemplateList';
```

**Løsning:**
```typescript
// Bruk TemplateLibrary istedenfor
import { TemplateLibrary } from '@/components/AuditActions/TemplateLibrary';
```

---

## Testing Checklist

Etter migrering, verifiser:

### ✅ Funksjonalitet
- [ ] Templates vises korrekt i library
- [ ] Client actions vises korrekt i liste
- [ ] Phase-filtrering fungerer
- [ ] Subject area-filtrering fungerer
- [ ] Søk fungerer som forventet
- [ ] Bulk operations virker (status update, delete)
- [ ] Drag-n-drop reordering virker
- [ ] Copy from template fungerer

### ✅ Visual
- [ ] Badges har riktige farger
- [ ] Phase labels er på norsk
- [ ] Subject area labels er fra database
- [ ] Empty states vises riktig
- [ ] Loading states vises riktig
- [ ] Error states håndteres

### ✅ Performance
- [ ] Store lister (100+ items) rendrer uten lag
- [ ] Virtualisering aktiveres automatisk
- [ ] Bulk operations er raske
- [ ] Queries caches riktig

### ✅ Type Safety
- [ ] Ingen TypeScript-feil
- [ ] Autcomplete fungerer i IDE
- [ ] Type-inferens fungerer

---

## Migrerings-eksempel (Fullstendig)

### Før migrering:

```typescript
// OldTemplateManager.tsx
import { useState } from 'react';
import { FlexibleActionTemplateList } from '@/components/AuditActions/FlexibleActionTemplateList';
import { useAuditActionTemplates } from '@/hooks/audit-actions/useActionTemplateCRUD';
import { SUBJECT_AREA_LABELS } from '@/types/audit-actions';

export function OldTemplateManager({ phase }: { phase: string }) {
  const [viewMode, setViewMode] = useState<'basic' | 'enhanced'>('basic');
  const { data: templates } = useAuditActionTemplates();
  
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      default: return 'secondary';
    }
  };
  
  const phaseLabel = phase === 'planning' ? 'Planlegging' : 
                     phase === 'execution' ? 'Utførelse' : phase;
  
  return (
    <div>
      <h2>{phaseLabel}</h2>
      <button onClick={() => setViewMode(viewMode === 'basic' ? 'enhanced' : 'basic')}>
        Toggle View
      </button>
      <FlexibleActionTemplateList
        templates={templates || []}
        viewMode={viewMode}
        onTemplateSelect={(t) => console.log('Selected:', t)}
      />
    </div>
  );
}
```

### Etter migrering:

```typescript
// NewTemplateManager.tsx
import { TemplateLibrary } from '@/components/AuditActions/TemplateLibrary';
import { getPhaseLabel } from '@/constants/auditPhases';
import type { AuditPhase } from '@/types/revio';

export function NewTemplateManager({ phase }: { phase: AuditPhase }) {
  const handleCopyToClient = (templateId: string) => {
    console.log('Copying template:', templateId);
  };
  
  return (
    <div>
      <h2>{getPhaseLabel(phase)}</h2>
      <TemplateLibrary
        phase={phase}
        onCopyToClient={handleCopyToClient}
      />
    </div>
  );
}
```

**Forbedringer:**
- ✅ 50% mindre kode
- ✅ Ingen duplisert logikk
- ✅ Bruker core components
- ✅ Unified phase handling
- ✅ View mode håndteres internt
- ✅ Badge-logikk gjenbrukes

---

## Trenger du hjelp?

- 📖 Les [API-referansen](./api-reference.md) for detaljert dokumentasjon
- 👨‍💻 Se [Utviklerguiden](./dev-guide.md) for praktiske eksempler
- 🏗️ Studer [Arkitekturen](./architecture.md) for å forstå systemet
- ✅ Følg [Best Practices](./best-practices.md) for anbefalte patterns

---

**Sist oppdatert:** November 2025  
**Vedlikeholdes av:** Revio Development Team
