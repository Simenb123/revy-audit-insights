import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { AnalysisGroup } from '@/hooks/useAnalysisGroups';

const groupSchema = z.object({
  name: z.string().min(1, 'Navn er påkrevd'),
  description: z.string().optional(),
  category: z.string().optional(),
});

export type AnalysisGroupFormData = z.infer<typeof groupSchema>;

interface AnalysisGroupFormProps {
  item?: AnalysisGroup | null;
  onSubmit: (data: AnalysisGroupFormData) => void;
}

const categories = [
  'Lønnsomhet',
  'Likviditet',
  'Soliditet',
  'Effektivitet',
  'Vekst'
];

const AnalysisGroupForm = ({ item, onSubmit }: AnalysisGroupFormProps) => {
  const form = useForm<AnalysisGroupFormData>({
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
              <FormLabel>Navn</FormLabel>
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
                    <SelectValue placeholder="Velg kategori..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
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

export default AnalysisGroupForm;