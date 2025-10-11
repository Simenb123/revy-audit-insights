# Migration Guide: Hardkodede Revio-klasser → Semantic Tokens

## 🎯 Formål
Denne guiden viser hvordan du migrerer komponenter fra hardkodede `revio-*` klasser til semantic brand tokens.

## ✅ Migrerte komponenter (Fase 2.3)

### Layout-komponenter
- ✅ `GlobalSubHeader.tsx`
- ✅ `ClientSubHeader.tsx`  
- ✅ `GlobalHeader.tsx`

## 📋 Migreringstabeller

### Bakgrunnsfarger

| ❌ Gammelt (hardkodet)    | ✅ Nytt (semantic)           | Bruksområde              |
|---------------------------|------------------------------|--------------------------|
| `bg-revio-50`             | `bg-brand-surface-light`     | Lys bakgrunn, tips       |
| `bg-revio-100`            | `bg-brand-surface`           | Surface, badge           |
| `bg-revio-200`            | `bg-brand-surface-hover`     | Hover states             |
| `bg-revio-500`            | `bg-brand-primary`           | Primary brand background |
| `bg-revio-600`            | `bg-brand-primary-hover`     | Primary hover            |
| `bg-revio-700`            | `bg-brand-primary-active`    | Primary active           |

### Tekstfarger

| ❌ Gammelt (hardkodet)    | ✅ Nytt (semantic)           | Bruksområde              |
|---------------------------|------------------------------|--------------------------|
| `text-revio-300`          | `text-brand-border`          | Disabled/subtle text     |
| `text-revio-800`          | `text-brand-text-muted`      | Secondary text           |
| `text-revio-900`          | `text-brand-text`            | Primary brand text       |

### Border-farger

| ❌ Gammelt (hardkodet)    | ✅ Nytt (semantic)           | Bruksområde              |
|---------------------------|------------------------------|--------------------------|
| `border-revio-200`        | `border-brand-surface-hover` | Light borders            |
| `border-revio-300`        | `border-brand-border`        | Standard borders         |
| `border-revio-500`        | `border-brand-primary`       | Accent borders           |

### Hover/Active states

| ❌ Gammelt (hardkodet)              | ✅ Nytt (semantic)                          |
|-------------------------------------|---------------------------------------------|
| `hover:bg-revio-600`                | `hover:bg-brand-primary-hover`              |
| `hover:bg-revio-200`                | `hover:bg-brand-surface-hover`              |
| `active:bg-revio-700`               | `active:bg-brand-primary-active`            |

## 🔧 Migreringseksempler

### Eksempel 1: SubHeader-komponenter

#### ❌ Før
```tsx
<div className="bg-revio-500 text-white">
  <h1>Tittel</h1>
</div>
```

#### ✅ Etter
```tsx
<div className="bg-brand-primary text-white">
  <h1>Tittel</h1>
</div>
```

### Eksempel 2: Badge-komponenter

#### ❌ Før
```tsx
<Badge className="bg-revio-100 text-revio-800 border-revio-200">
  Status
</Badge>
```

#### ✅ Etter (Option 1: Utility classes)
```tsx
<Badge className="bg-brand-surface text-brand-text-muted border-brand-surface-hover">
  Status
</Badge>
```

#### ✅ Etter (Option 2: Extended variant)
```tsx
import { extendedBadgeVariants } from "@/components/ui/badge-variants";

<span className={cn(extendedBadgeVariants({ variant: "brand" }))}>
  Status
</span>
```

### Eksempel 3: Button-komponenter

#### ❌ Før
```tsx
<Button className="bg-revio-500 hover:bg-revio-600 text-white">
  Klikk her
</Button>
```

#### ✅ Etter (Preferred: Use variant)
```tsx
<Button variant="brand">
  Klikk her
</Button>
```

#### ✅ Etter (Alternative: Utility classes)
```tsx
<Button className="bg-brand-primary hover:bg-brand-primary-hover text-white">
  Klikk her
</Button>
```

### Eksempel 4: Card-komponenter

#### ❌ Før
```tsx
<Card className="bg-revio-50 border-revio-200">
  <CardHeader>
    <CardTitle className="text-revio-900">Tittel</CardTitle>
  </CardHeader>
  <CardContent className="text-revio-800">
    Innhold
  </CardContent>
</Card>
```

#### ✅ Etter
```tsx
<Card className="bg-brand-surface-light border-brand-surface-hover">
  <CardHeader>
    <CardTitle className="text-brand-text">Tittel</CardTitle>
  </CardHeader>
  <CardContent className="text-brand-text-muted">
    Innhold
  </CardContent>
</Card>
```

### Eksempel 5: Ikoner og Spinners

#### ❌ Før
```tsx
<FileText className="text-revio-500" />
<div className="border-b-2 border-revio-500 animate-spin" />
```

#### ✅ Etter
```tsx
<FileText className="text-brand-primary" />
<div className="border-b-2 border-brand-primary animate-spin" />
```

## 📊 Status oversikt

| Kategori              | Antall filer | Migrert | Gjenstående |
|-----------------------|--------------|---------|-------------|
| Layout-komponenter    | 3            | 3 ✅    | 0           |
| Badge-komponenter     | ?            | 0       | ?           |
| Button-komponenter    | ?            | 0       | ?           |
| Card-komponenter      | ?            | 0       | ?           |
| Form-komponenter      | ?            | 0       | ?           |
| Dashboard-komponenter | ?            | 0       | ?           |
| **Totalt**            | **64+**      | **3**   | **61+**     |

## ⏭️ Neste steg

1. Identifiser neste kategori (anbefalt: Badge-komponenter)
2. Migrer 2-3 komponenter som eksempel
3. Test visuelt for å verifisere at alt ser riktig ut
4. Fortsett gradvis med øvrige komponenter

## 🔗 Relaterte ressurser

- `docs/color-palette.md` - Full fargeoversikt
- `docs/design/component-variants.md` - Hvordan bruke variants
- `docs/design/design-token-audit.md` - Komplett audit rapport
- `src/index.css` - Semantic token definisjoner
- `tailwind.config.ts` - HSL color scale
