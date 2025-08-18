# Data Table Component Template

## Prompt for GPT-5 Canvas
```
Lag en React komponenti for en data-tabell som viser [beskrivelse av data]. 

TEKNISKE KRAV:
- React 18 + TypeScript
- Bruk shadcn/ui Table komponenter
- TanStack Query for data fetching
- Supabase client for backend
- Norsk UI tekst

FEATURES:
- Søk og filtrering
- Sortering på kolonner
- Paginering (50 items per side)
- Loading og error states
- Responsive design (mobil og desktop)

DESIGN:
- Bruk semantiske farger fra design system (bg-card, text-foreground, etc.)
- Ingen hardkodede farger (ikke bg-white, text-black etc.)
- Følg Revio design patterns

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
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { use[DataType] } from '../hooks/use[DataType]';

interface [DataType]TableProps {
  // Props interface
}

const [DataType]Table: React.FC<[DataType]TableProps> = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data, isLoading, error } = use[DataType]();

  if (isLoading) return <div>Laster...</div>;
  if (error) return <div>Feil ved lasting av data</div>;

  const filteredData = data?.filter(item => 
    item.name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>[Tabell Tittel]</CardTitle>
        <Input
          placeholder="Søk..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </CardHeader>
      <CardContent>
        <div className="overflow-auto max-h-96">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Navn</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Opprettet</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.status}</TableCell>
                  <TableCell>{new Date(item.created_at).toLocaleDateString('nb-NO')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default [DataType]Table;
```