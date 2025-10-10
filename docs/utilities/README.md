# Revio Utilities Inventory

En komplett oversikt over gjenbrukbare utilities og helpers i Revio-plattformen.

---

## 📁 File Processing

### fileProcessing.ts
**Lokasjon:** `src/utils/fileProcessing.ts`  
**Dokumentasjon:** [File Processing Guide](./file-processing.md)  
**Brukt i:** 17+ upload-komponenter

**Nøkkelfunksjoner:**
- Excel/CSV/SAF-T parsing
- Auto-mapping av kolonner
- Field definitions og validering
- Duplicate detection

**Quick start:**
```tsx
import { processExcelFile, createFieldDefinitions } from '@/utils/fileProcessing';

const fields = createFieldDefinitions([
  { key: 'name', label: 'Navn', required: true },
  { key: 'email', label: 'E-post', type: 'email' },
]);

const { data, errors } = await processExcelFile(file, fields);
```

---

## 🔢 Data Transformation

### formatters.ts
**Lokasjon:** `src/utils/formatters.ts`

**Nøkkelfunksjoner:**
- `formatCurrency(value)` - Norsk valutaformatting
- `formatPercentage(value)` - Prosentformatting
- `formatDate(date)` - Dato/tid formatting
- `formatNumber(value)` - Tallformatting med tusenavskiller

**Quick start:**
```tsx
import { formatCurrency, formatDate } from '@/utils/formatters';

<p>{formatCurrency(1234567)} kr</p> // "1 234 567 kr"
<p>{formatDate(new Date())}</p> // "10.01.2025"
```

---

### sanitizeNorwegianChars
**Lokasjon:** `src/components/ui/standard-data-table.tsx` (linje 47-54)

**Nøkkelfunksjoner:**
- Konverterer æ, ø, å til ae, o, a
- Sikrer Excel/PDF export-kompatibilitet

**Quick start:**
```tsx
import { sanitizeNorwegianChars } from '@/components/ui/standard-data-table';

const sanitized = sanitizeNorwegianChars("Bjørn Åsen"); // "Bjorn Asen"
```

---

## 📊 Data Analysis

### usePivotData
**Lokasjon:** `src/hooks/usePivotData.ts`

**Nøkkelfunksjoner:**
- Transformerer hovedbok-data til pivot-format
- Håndterer klient/gruppe scope
- Filtrerer per regnskapsår

**Quick start:**
```tsx
import { usePivotData } from '@/hooks/usePivotData';

const { data, isLoading } = usePivotData({
  clientId,
  dataSource: 'trial_balance',
});
```

---

### useTrialBalanceWithMappings
**Lokasjon:** `src/hooks/useTrialBalanceWithMappings.ts`

**Nøkkelfunksjoner:**
- Henter hovedbok med account mappings
- Beregner NS-verdier (sum av mapped accounts)
- Filtrerer per regnskapsår

---

## 🔐 Authentication & Authorization

### useAuth
**Lokasjon:** `src/hooks/useAuth.ts`

**Nøkkelfunksjoner:**
- `user` - Current user object
- `isAuthenticated` - Boolean auth status
- `login(email, password)` - Login function
- `logout()` - Logout function
- `signUp(email, password)` - Registration

**Quick start:**
```tsx
import { useAuth } from '@/hooks/useAuth';

const { user, isAuthenticated, logout } = useAuth();

if (!isAuthenticated) return <LoginPage />;
```

---

### usePermissions
**Lokasjon:** `src/hooks/usePermissions.ts`

**Nøkkelfunksjoner:**
- `hasPermission(permission)` - Check user permission
- `canEditClient(clientId)` - Client-specific access
- `isAdmin()` - Admin check

---

## 🎯 Business Logic

### useKPICalculator
**Lokasjon:** `src/hooks/useKPICalculator.ts`

**Nøkkelfunksjoner:**
- Evaluerer formler (f.eks. "3000 + 3010")
- Henter account-verdier
- Støtter operatorer (+, -, *, /)

**Quick start:**
```tsx
import { useKPICalculator } from '@/hooks/useKPICalculator';

const { calculate } = useKPICalculator();
const result = calculate("3000 + 3010"); // Sum av to kontoer
```

---

### useFiscalYear
**Lokasjon:** `src/hooks/useFiscalYear.ts`

**Nøkkelfunksjoner:**
- Henter gjeldende regnskapsår for klient
- `fiscalYear` - Current fiscal year object
- `startDate`, `endDate` - Periode
- `isLoading` - Loading state

---

## 📝 Logging & Debugging

### logger.ts
**Lokasjon:** `src/utils/logger.ts`

**Nøkkelfunksjoner:**
- `logger.info(message, data)` - Info logging
- `logger.error(message, error)` - Error logging
- `logger.warn(message, data)` - Warning logging
- `logger.debug(message, data)` - Debug logging

**Quick start:**
```tsx
import { logger } from '@/utils/logger';

try {
  // ... code
} catch (error) {
  logger.error('Failed to fetch data:', error);
  throw error;
}
```

---

## 🌐 API & Supabase

### supabase client
**Lokasjon:** `src/integrations/supabase/client.ts`

**Nøkkelfunksjoner:**
- Pre-konfigurert Supabase client
- Type-safe queries
- RLS enforcement

**Quick start:**
```tsx
import { supabase } from '@/integrations/supabase/client';

const { data, error } = await supabase
  .from('clients')
  .select('*')
  .eq('id', clientId)
  .single();
```

---

### useQuery patterns
**Brukt i:** Alle data-fetching hooks

**Standard pattern:**
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

---

## 🎨 Styling Utilities

### cn (classnames utility)
**Lokasjon:** `src/lib/utils.ts`

**Nøkkelfunksjoner:**
- Kombinerer Tailwind classes
- Conditional styling
- Merge conflicts intelligently

**Quick start:**
```tsx
import { cn } from '@/lib/utils';

<div className={cn(
  "base-class",
  isActive && "active-class",
  className
)} />
```

---

## 📅 Date & Time

### date-fns utilities
**Pakke:** `date-fns`

**Vanlige funksjoner:**
```tsx
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { nb } from 'date-fns/locale';

format(new Date(), 'dd.MM.yyyy', { locale: nb });
```

---

## 📤 Export Utilities

### exportToExcel
**Brukt i:** StandardDataTable, PivotWidget

**Nøkkelfunksjoner:**
- XLSX export
- Auto-formatting
- Multiple sheets støtte

---

### exportToPDF
**Brukt i:** StandardDataTable

**Nøkkelfunksjoner:**
- jsPDF + autotable
- Norsk formatting
- Header/footer støtte

---

## 🔄 State Management

### useLocalStorage
**Lokasjon:** `src/hooks/useLocalStorage.ts`

**Nøkkelfunksjoner:**
- Persistent state i localStorage
- Type-safe
- SSR-safe

**Quick start:**
```tsx
import { useLocalStorage } from '@/hooks/useLocalStorage';

const [settings, setSettings] = useLocalStorage('userSettings', {
  theme: 'light',
});
```

---

### useDebounce
**Lokasjon:** `src/hooks/useDebounce.ts`

**Nøkkelfunksjoner:**
- Debounce values
- Reduserer API calls
- Configurable delay

**Quick start:**
```tsx
import { useDebounce } from '@/hooks/useDebounce';

const [search, setSearch] = useState('');
const debouncedSearch = useDebounce(search, 500);

// Use debouncedSearch in API calls
```

---

## ✅ Validation

### Zod schemas
**Brukt i:** Forms, API validation

**Standard pattern:**
```tsx
import { z } from 'zod';

const clientSchema = z.object({
  name: z.string().min(1, 'Navn er påkrevd'),
  email: z.string().email('Ugyldig e-postadresse'),
  phone: z.string().optional(),
});

type Client = z.infer<typeof clientSchema>;
```

---

## 🎯 Common Patterns

### Error Handling
```tsx
import { logger } from '@/utils/logger';
import { useToast } from '@/hooks/use-toast';

try {
  // ... operation
} catch (error) {
  logger.error('Operation failed:', error);
  toast({
    title: "Feil",
    description: error.message,
    variant: "destructive",
  });
}
```

### Loading States
```tsx
import { useQuery } from '@tanstack/react-query';

const { data, isLoading, error } = useQuery({
  queryKey: ['data'],
  queryFn: fetchData,
});

if (isLoading) return <Skeleton />;
if (error) return <ErrorState error={error} />;
return <DataDisplay data={data} />;
```

---

## 📦 NPM Packages (Key Utilities)

- **TanStack Query:** Data fetching & caching
- **Zod:** Schema validation
- **date-fns:** Date manipulation
- **XLSX:** Excel file handling
- **jsPDF:** PDF generation
- **Fuse.js:** Fuzzy search
- **Papa Parse:** CSV parsing

---

## ✅ Best Practices

1. **Gjenbruk eksisterende utilities** - Ikke skriv duplicate logic
2. **Type-safety first** - Bruk TypeScript interfaces for alle utilities
3. **Error handling** - Alltid håndter errors med logger + toast
4. **Testing** - Skriv unit tests for kritiske utilities
5. **Documentation** - Dokumenter nye utilities i denne filen
6. **Performance** - Bruk debounce/throttle for dyre operasjoner

---

**Sist oppdatert:** 2025-01-10  
**Vedlikeholdes av:** Revio Development Team
