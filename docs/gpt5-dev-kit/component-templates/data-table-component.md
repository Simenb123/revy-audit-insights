# Data Table Component Template

## Prompt for GPT-5 Canvas
```
Lag en React komponenti for en data-tabell som viser [beskrivelse av data]. 

TEKNISKE KRAV:
- React 18 + TypeScript
- Bruk StandardDataTable komponent (IKKE primitive Table)
- TanStack Query for data fetching
- Supabase client for backend
- Norsk UI tekst

FEATURES (inkludert automatisk):
- Søk og filtrering
- Sortering på kolonner
- Kolonnevalg og visningsinnstillinger
- Export til Excel
- Loading og error states
- Responsive design
- Norske tegn støtte

DESIGN:
- Bruk semantiske farger fra design system
- Følg Revio design patterns
- Automatisk høyrejustert for beløp/tall
- Sticky headers som ikke overlapper tekst

DATA STRUKTUR:
[Beskriv datastruktur her]

SUPABASE TABELL:
Tabellnavn: [table_name]
RLS: Aktivert (user_id basert tilgang)

Lag komplett komponent med types, hooks og error handling.
```

## Standard Template Struktur
```typescript
// types.ts
export interface [DataType] {
  id: string;
  [field]: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// hooks/use[DataType].ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const use[DataType] = () => {
  return useQuery({
    queryKey: ['[data-type]'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('[table_name]')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });
};

// components/[DataType]Table.tsx
import React from 'react';
import StandardDataTable, { StandardDataTableColumn } from '@/components/ui/standard-data-table';
import { use[DataType] } from '../hooks/use[DataType]';
import { [DataType] } from '../types';

interface [DataType]TableProps {
  // Props interface
}

const [DataType]Table: React.FC<[DataType]TableProps> = () => {
  const { data = [], isLoading, error } = use[DataType]();

  const columns: StandardDataTableColumn<[DataType]>[] = [
    {
      key: 'name',
      header: 'Navn',
      accessor: 'name',
      sortable: true,
      searchable: true
    },
    {
      key: 'status',
      header: 'Status',
      accessor: 'status',
      sortable: true,
      format: (value) => value || 'Ikke satt'
    },
    {
      key: 'created_at',
      header: 'Opprettet',
      accessor: 'created_at',
      sortable: true,
      align: 'center',
      format: (value) => new Date(value).toLocaleDateString('nb-NO')
    }
  ];

  return (
    <StandardDataTable
      title="[Tabell Tittel]"
      description="[Beskrivelse av tabellen]"
      data={data}
      columns={columns}
      isLoading={isLoading}
      error={error}
      tableName="[data-type]"
      exportFileName="[data-type]-export"
    />
  );
};

export default [DataType]Table;
```