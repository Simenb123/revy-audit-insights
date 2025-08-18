# Supabase Database Query Snippets

## Standard Query Patterns

### Basic Select with RLS
```typescript
// Single record
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('id', recordId)
  .single();

// Multiple records with user filter
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });

// With relations
const { data, error } = await supabase
  .from('clients')
  .select(`
    *,
    client_documents(id, file_name, created_at),
    profiles(first_name, last_name)
  `)
  .eq('user_id', userId);
```

### Insert Pattern
```typescript
const { data, error } = await supabase
  .from('table_name')
  .insert({
    ...formData,
    user_id: (await supabase.auth.getUser()).data.user?.id,
    created_at: new Date().toISOString(),
  })
  .select()
  .single();
```

### Update Pattern
```typescript
const { data, error } = await supabase
  .from('table_name')
  .update({
    ...updateData,
    updated_at: new Date().toISOString(),
  })
  .eq('id', recordId)
  .eq('user_id', userId) // RLS enforcement
  .select()
  .single();
```

### Delete Pattern
```typescript
const { error } = await supabase
  .from('table_name')
  .delete()
  .eq('id', recordId)
  .eq('user_id', userId); // RLS enforcement
```

## Revio-Specific Queries

### Client Data
```typescript
// Get client with audit firm info
const { data, error } = await supabase
  .from('clients')
  .select(`
    *,
    audit_firms(name, org_number),
    profiles(first_name, last_name, email)
  `)
  .eq('id', clientId)
  .single();

// Get client documents with categorization
const { data, error } = await supabase
  .from('client_documents_files')
  .select(`
    *,
    client_documents(title, description),
    unified_categories(name, color)
  `)
  .eq('client_id', clientId)
  .order('created_at', { ascending: false });
```

### AI Usage Stats
```typescript
// User AI usage
const { data, error } = await supabase
  .from('ai_usage_logs')
  .select('*')
  .eq('user_id', userId)
  .gte('created_at', startDate)
  .lte('created_at', endDate)
  .order('created_at', { ascending: false });

// Firm AI usage summary
const { data, error } = await supabase
  .rpc('get_firm_ai_usage_summary', {
    firm_id: firmId,
    date_from: startDate,
    date_to: endDate
  });
```

### Knowledge Base
```typescript
// Search knowledge articles
const { data, error } = await supabase
  .from('knowledge_articles')
  .select(`
    *,
    knowledge_categories(name, slug)
  `)
  .textSearch('title', searchTerm)
  .eq('status', 'published')
  .order('view_count', { ascending: false });

// Get article with full content
const { data, error } = await supabase
  .from('knowledge_articles')
  .select('*')
  .eq('slug', articleSlug)
  .eq('status', 'published')
  .single();
```

### Audit Actions
```typescript
// Get actions for client
const { data, error } = await supabase
  .from('audit_actions')
  .select(`
    *,
    audit_action_templates(name, description),
    profiles(first_name, last_name)
  `)
  .eq('client_id', clientId)
  .order('created_at', { ascending: false });

// Update action progress
const { data, error } = await supabase
  .from('audit_actions')
  .update({
    progress_percentage: newProgress,
    status: newProgress === 100 ? 'completed' : 'in_progress',
    updated_at: new Date().toISOString()
  })
  .eq('id', actionId)
  .select()
  .single();
```

## React Query Integration

### Query Hook Pattern
```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useClientData = (clientId: string) => {
  return useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });
};
```

### Mutation Hook Pattern
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useCreateClient = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (clientData: CreateClientData) => {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          ...clientData,
          user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: "Vellykket",
        description: "Klient ble opprettet",
      });
    },
    onError: (error) => {
      toast({
        title: "Feil",
        description: "Kunne ikke opprette klient",
        variant: "destructive",
      });
    }
  });
};
```

## Error Handling Pattern
```typescript
try {
  const { data, error } = await supabase
    .from('table_name')
    .select('*');
  
  if (error) {
    logger.error('Supabase query error:', error);
    throw new Error(`Database error: ${error.message}`);
  }
  
  return data;
} catch (error) {
  logger.error('Unexpected error:', error);
  throw error;
}
```

## Pagination Pattern
```typescript
const { data, error } = await supabase
  .from('table_name')
  .select('*', { count: 'exact' })
  .range(startIndex, endIndex)
  .order('created_at', { ascending: false });
```