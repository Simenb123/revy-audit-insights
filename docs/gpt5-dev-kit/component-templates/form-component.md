# Form Component Template

## Prompt for GPT-5 Canvas
```
Lag en React form komponent for [beskrivelse av form].

TEKNISKE KRAV:
- React Hook Form + Zod validation
- shadcn/ui form komponenter
- TanStack Query mutations
- Supabase backend
- TypeScript interfaces
- Norsk feilmeldinger og labels

FORM FELTER:
[Liste over feltene som trengs]

VALIDERING:
- Påkrevde felter markert med *
- [Spesifikke valideringsregler]

SUPABASE:
- Tabell: [table_name]
- RLS: user_id basert tilgang
- Edge function: [function_name] (hvis nødvendig)

DESIGN:
- Responsiv layout (mobil/desktop)
- Loading state på submit
- Success/error toasts
- Semantiske farger fra design system

Lag komplett form med validation schema, mutation og error handling.
```

## Standard Template
```typescript
// schemas/[formName]Schema.ts
import { z } from 'zod';

export const [formName]Schema = z.object({
  name: z.string().min(1, 'Navn er påkrevd'),
  email: z.string().email('Ugyldig e-postadresse'),
  description: z.string().optional(),
});

export type [FormName]Data = z.infer<typeof [formName]Schema>;

// hooks/use[FormName]Mutation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { [FormName]Data } from '../schemas/[formName]Schema';

export const use[FormName]Mutation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: [FormName]Data) => {
      const { data: result, error } = await supabase
        .from('[table_name]')
        .insert({
          ...data,
          user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['[data-key]'] });
      toast({
        title: "Vellykket",
        description: "[Beskrivelse] ble opprettet",
      });
    },
    onError: (error) => {
      toast({
        title: "Feil",
        description: "Kunne ikke opprette [beskrivelse]",
        variant: "destructive",
      });
    }
  });
};

// components/[FormName].tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { [formName]Schema, [FormName]Data } from '../schemas/[formName]Schema';
import { use[FormName]Mutation } from '../hooks/use[FormName]Mutation';

interface [FormName]Props {
  onSuccess?: () => void;
}

const [FormName]: React.FC<[FormName]Props> = ({ onSuccess }) => {
  const form = useForm<[FormName]Data>({
    resolver: zodResolver([formName]Schema),
    defaultValues: {
      name: '',
      email: '',
      description: '',
    },
  });

  const mutation = use[FormName]Mutation();

  const onSubmit = async (data: [FormName]Data) => {
    await mutation.mutateAsync(data);
    form.reset();
    onSuccess?.();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>[Form Tittel]</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Navn *</FormLabel>
                  <FormControl>
                    <Input placeholder="Skriv inn navn" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-post *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="din@email.no" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              disabled={mutation.isPending}
              className="w-full"
            >
              {mutation.isPending ? 'Lagrer...' : 'Lagre'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default [FormName];
```