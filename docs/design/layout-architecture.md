# Layout Architecture

## Header Hierarchy

Revio har en 2-nivås header-struktur med klar visuell og funksjonell separasjon:

### Nivå 1: Global Header (GlobalHeader.tsx)
- **Posisjon**: Øverst på siden, alltid synlig
- **Token**: `--brand-header` (lysere: `--revio-400`)
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
- **Token**: `--brand-header` (deler samme farge som GlobalHeader)
- **Z-index**: 40
- **Innhold**: Varierer basert på variant (se under)
- **Høyde**: `--sub-header-height` (30px)
- **Sticky posisjon**: `top: var(--global-header-current-height)`
- **Styling**: `bg-brand-header text-white`

#### Sub Header Varianter

**GlobalSubHeader.tsx**
- Standard subheader for globale sider
- Innhold: Breadcrumbs, side-tittel, actions, filters
- Fleksible content-områder: `leftContent`, `centerContent`, `rightContent`
- Støtter tilbake-knapp (optional)

**ClientSubHeader.tsx**
- Spesialisert subheader for klientvisninger
- Innhold: Klientnavn, org.nummer, regnskapsårvelger, materialitetsoppsummering
- Rendres via `StickyClientLayout.tsx`
- Brukes typisk i klient-kontekst sider

### Nivå 3: Sidebar
- **Posisjon**: Venstre side
- **Token**: `--sidebar-background` (mørkere: `--revio-500`)
- **Z-index**: 30
- **Innhold**: Hovednavigasjon, modul-meny
- **Styling**: Mørkere teal-farge for visuell separasjon

## Token-bruk

### Farger
```css
/* Definert i src/index.css */

/* Revio-skala (HSL) */
--revio-400: 174 57% 58%;  /* Lysere teal - brukes til headers */
--revio-500: 173 57% 39%;  /* Mørkere teal - brukes til sidebar */

/* Semantiske tokens */
--brand-header: var(--revio-400);           /* Begge header-nivåer */
--sidebar-background: var(--revio-500);     /* Sidebar */
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
- Rendrer subheader fra context ELLER GlobalSubHeader som fallback
- Plasseres i `GridLayoutContainer.tsx`

### StickyClientLayout.tsx
- Wrapper-komponent for klient-sider
- Setter automatisk ClientSubHeader via SubHeaderContext
- Håndterer klient-spesifikk informasjon (navn, org.nr, regnskapsår)

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

## Debugging

### Problemer med sticky positioning
- Sjekk at CSS-variablene er satt korrekt
- Verifiser z-index hierarki (header: 50, subheader: 40, sidebar: 30)
- Sjekk at `top` er satt til riktig verdi

### Feil farger
- Sjekk at tokens er definert i `src/index.css`
- Verifiser at `--brand-header` og `--sidebar-background` brukes konsistent
- Se etter hardkodede hex-verdier som bør erstattes med tokens
