# Layout Architecture

> 📘 **Ny til Revio UI?** Start med [UI Architecture Overview](./ui-architecture.md) for komplett system-forklaring.
> 
> Dette dokumentet fokuserer spesifikt på **header-hierarki og styling**. 
> For full layout-struktur, contexts og komponenter, se [UI Architecture](./ui-architecture.md).

## Header Hierarchy

Revio har en 2-nivås header-struktur med klar visuell og funksjonell separasjon:

### Nivå 1: Global Header (GlobalHeader.tsx)
- **Posisjon**: Øverst på siden, alltid synlig
- **Token**: `--brand-header` (mørkere: `--revio-500`)
- **Z-index**: 50
- **Innhold**: 
  - Logo og appnavn
  - Global søkefunksjon
  - Nylig besøkte klienter (RecentClientsDropdown)
  - Innstillinger-dropdown (Settings)
  - Bruker-dropdown med avatar
- **Høyde**: `--global-header-height` (45px)
- **Sticky posisjon**: `top: 0`
- **Styling**: `bg-brand-header/95 backdrop-blur`

### Nivå 2: Sub Header (GlobalSubHeader.tsx / ClientSubHeader.tsx)
- **Posisjon**: Under GlobalHeader, context-spesifikt innhold
- **Token**: `--brand-header` (mørkere: `--revio-500`, deler samme farge som GlobalHeader)
- **Z-index**: 40
- **Innhold**: Varierer basert på variant (se under)
- **Høyde**: `--sub-header-height` (30px)
- **Sticky posisjon**: `top: var(--global-header-current-height)`
- **Styling**: `bg-brand-header text-white`

#### Sub Header Varianter

**GlobalSubHeader.tsx**
Standard sub-header variant for ALLE sider (både globale og klient).
- Fleksible content-områder: `leftContent`, `centerContent`, `rightContent`
- Brukes direkte ELLER via StickyClientLayout
- Viser breadcrumbs, page title, actions, filters
- Støtter tilbake-knapp (optional)

**ClientSubHeader.tsx** ⚠️
Standalone komponent for klient-spesifikt innhold.
- **IKKE brukt av StickyClientLayout** (som bruker GlobalSubHeader)
- Kan brukes direkte hvis du trenger custom layout som ikke passer GlobalSubHeader
- For nye klient-sider, bruk heller StickyClientLayout som bruker GlobalSubHeader

### Nivå 3: Sidebar
- **Posisjon**: Venstre side
- **Token**: `--sidebar-background` (mørkere: `--revio-500`)
- **Z-index**: 30
- **Innhold**: Hovednavigasjon, modul-meny
- **Styling**: Samme mørkere teal-farge som headers for konsistent navigasjonsopplevelse

## Token-bruk

### Farger
```css
/* Definert i src/index.css */

/* Revio-skala (HSL) */
--revio-400: 174 57% 58%;  /* Lysere teal */
--revio-500: 173 57% 39%;  /* Mørkere teal - brukes til både headers og sidebar */

/* Semantiske tokens */
--brand-header: var(--revio-500);           /* Begge header-nivåer - matcher sidebar */
--sidebar-background: var(--revio-500);     /* Sidebar - matcher headers */
```

### Høyder
```css
/* Layout høyder */
--global-header-height: 45px;      /* GlobalHeader */
--sub-header-height: 30px;         /* GlobalSubHeader / ClientSubHeader */

/* Dynamiske beregnede høyder */
--global-header-current-height: var(--global-header-height);
--sub-header-current-height: 0px;  /* Settes dynamisk hvis subheader er synlig */
```

## Layout-komponenter

### SubHeaderContext.tsx
- React Context for dynamisk subheader-håndtering
- Lar sider definere egen subheader via `setSubHeader()`
- Rendres via `SubHeaderHost.tsx`

### SubHeaderHost.tsx
- Rendrer subheader fra SubHeaderContext
- Hvis context har node → render den
- Fallback til tom GlobalSubHeader hvis ingen custom content
- Plasseres i `AppLayout.tsx`

### StickyClientLayout.tsx
- Wrapper-komponent for klient-sider
- Setter automatisk **GlobalSubHeader** via SubHeaderContext (IKKE ClientSubHeader)
- Håndterer klient-spesifikk informasjon (navn, org.nr, regnskapsår, materialitet)

## Best Practices

### DO ✅
- Bruk `setSubHeader()` fra SubHeaderContext for å definere side-spesifikk subheader
- Bruk semantiske tokens (`--brand-header`, `--sidebar-background`)
- Sørg for at subheader alltid har `sticky top-[var(--global-header-current-height)]`
- Bruk `data-sub-header` attributt på subheader-elementer

### DON'T ❌
- Hardkod farger direkte (bruk tokens)
- Endre z-index uten å forstå hierarkiet
- Glem å cleane up subheader i useEffect cleanup
- Mix header og subheader styling

## Eksempler

### Standard side med GlobalSubHeader
```tsx
// Side uten spesiell subheader - GlobalSubHeader rendres automatisk
<div className="container mx-auto p-6">
  <PageHeader title="Min Side" />
  {/* content */}
</div>
```

### Side med custom subheader
```tsx
const MyPage = () => {
  const { setSubHeader, clearSubHeader } = useSubHeader();
  
  useEffect(() => {
    setSubHeader(
      <GlobalSubHeader
        leftContent={<h1>Custom tittel</h1>}
        rightContent={<Button>Action</Button>}
      />
    );
    return () => clearSubHeader();
  }, [setSubHeader, clearSubHeader]);
  
  return <div>{/* content */}</div>;
};
```

### Klient-side med ClientSubHeader
```tsx
const ClientPage = () => {
  return (
    <StickyClientLayout
      clientName="Acme AS"
      orgNumber="123456789"
      pageTitle="Klientoversikt"
    >
      {/* content */}
    </StickyClientLayout>
  );
};
```

## Layout Strategy for Pages

### Beslutningstre: Hvilken layout skal du bruke?

**Spørsmål 1: Er det en klient-spesifikk side?**
- ✅ JA → Bruk `StickyClientLayout`
- ❌ NEI → Gå til spørsmål 2

**Spørsmål 2: Trenger siden header/footer/spacing?**
- ✅ JA → Bruk `PageLayout`
- ❌ NEI → Gå til spørsmål 3

**Spørsmål 3: Trenger siden kun bredde-kontroll?**
- ✅ JA → Bruk `ResponsiveLayout` (alias for `GlobalLayoutContainer`)
- ❌ NEI → Gå til spørsmål 4

**Spørsmål 4: Trenger siden finere kontroll over spacing OG bredde?**
- ✅ JA → Bruk `ConstrainedWidth` + `StandardPageLayout`

### Layout-komponenter oversikt

| Komponent | Bruksområde | Width Options | Spacing |
|-----------|-------------|---------------|---------|
| `StickyClientLayout` | Klient-sider | N/A | Automatisk |
| `PageLayout` | Standard sider | `narrow`, `medium`, `wide`, `full` | `compact`, `normal`, `relaxed` |
| `ResponsiveLayout` | Kun bredde-kontroll | `narrow`, `medium`, `wide`, `full` | Ingen |
| `ConstrainedWidth` | Kun bredde | `narrow`, `medium`, `wide`, `full` | Ingen |
| `StandardPageLayout` | Header/footer/spacing | N/A | `compact`, `normal`, `relaxed` |

### Width Token Mapping

```css
narrow:  max-w-[var(--content-narrow)]   /* ~720px */
medium:  max-w-[var(--content-medium)]   /* ~960px */
wide:    max-w-[var(--content-wide)]     /* ~1280px */
full:    max-w-full                      /* 100% */
```

### Spacing Token Mapping

```css
compact:  space-y-[var(--space-4)]       /* 16px */
normal:   space-y-[var(--content-gap)]   /* 24px */
relaxed:  space-y-[var(--section-gap)]   /* 32px */
```

## Anti-Patterns (UNNGÅ DISSE)

### ❌ Hardkodet padding
```tsx
// FEIL - hardkodet padding
<div className="space-y-6 p-6">
```

### ❌ Hardkodet width
```tsx
// FEIL - hardkodet width
<main className="container mx-auto p-4">
```

### ❌ Blanding av layout og content
```tsx
// FEIL - layout og content mixed
<div className="p-4 md:p-6">
  <h1>Min side</h1>
```

### ✅ Korrekt bruk av layout
```tsx
// RIKTIG - bruk layout-komponent
<PageLayout width="wide" spacing="normal">
  <h1>Min side</h1>
</PageLayout>
```

## Debugging

### Problemer med sticky positioning
- Sjekk at CSS-variablene er satt korrekt
- Verifiser z-index hierarki (header: 50, subheader: 40, sidebar: 30)
- Sjekk at `top` er satt til riktig verdi

### Feil farger
- Sjekk at tokens er definert i `src/index.css`
- Verifiser at `--brand-header` og `--sidebar-background` brukes konsistent
- Se etter hardkodede hex-verdier som bør erstattes med tokens

### Layout issues
- Bruk beslutningstreet ovenfor for å velge riktig komponent
- Unngå hardkodede `p-4`, `p-6`, `container mx-auto`
- Bruk width og spacing props istedenfor Tailwind classes
- Test responsivitet (mobil, tablet, desktop)
