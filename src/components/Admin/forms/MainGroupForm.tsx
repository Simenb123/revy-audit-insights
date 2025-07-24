import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { MainGroup } from '@/hooks/useMainGroups';

const groupSchema = z.object({
  name: z.string().min(1, 'Navn er påkrevd'),
  description: z.string().optional(),
  category: z.string().optional(),
});

export type MainGroupFormData = z.infer<typeof groupSchema>;

interface MainGroupFormProps {
  item?: MainGroup | null;
  onSubmit: (data: MainGroupFormData) => void;
}

const categories = [
  'income_statement',
  'balance_sheet', 
  'cash_flow',
  'notes'
];

const MainGroupForm = ({ item, onSubmit }: MainGroupFormProps) => {
  const form = useForm<MainGroupFormData>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: item?.name || '',
      description: item?.description || '',
      category: item?.category || '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hovedgruppenavn</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Beskrivelse</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kategori</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg regnskapstype..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="income_statement">Resultatregnskap</SelectItem>
                  <SelectItem value="balance_sheet">Balanse</SelectItem>
                  <SelectItem value="cash_flow">Kontantstrøm</SelectItem>
                  <SelectItem value="notes">Noter</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-2">
          <Button type="submit">{item ? 'Oppdater' : 'Opprett'}</Button>
        </div>
      </form>
    </Form>
  );
};

export default MainGroupForm;