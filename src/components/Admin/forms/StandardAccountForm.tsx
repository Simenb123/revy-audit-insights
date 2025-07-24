import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';

const accountSchema = z.object({
  standard_number: z.string().min(1),
  standard_name: z.string().min(1),
  account_type: z.enum(['asset', 'liability', 'equity', 'revenue', 'expense']),
  category: z.string().optional(),
  analysis_group: z.string().optional(),
  line_type: z.enum(['detail', 'subtotal', 'calculation']).default('detail'),
  display_order: z.number().default(0),
  is_total_line: z.boolean().default(false),
  sign_multiplier: z.number().default(1),
  calculation_formula: z.string().optional(),
  parent_line_id: z.string().optional(),
});

export type StandardAccountFormData = z.infer<typeof accountSchema>;

interface StandardAccountFormProps {
  defaultValues?: Partial<StandardAccountFormData>;
  onSubmit: (data: StandardAccountFormData) => void;
}

const StandardAccountForm = ({ defaultValues, onSubmit }: StandardAccountFormProps) => {
  const form = useForm<StandardAccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      standard_number: '',
      standard_name: '',
      account_type: 'asset',
      category: '',
      analysis_group: '',
      line_type: 'detail',
      display_order: 0,
      is_total_line: false,
      sign_multiplier: 1,
      calculation_formula: '',
      parent_line_id: '',
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="standard_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kontonummer</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="standard_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kontonavn</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="account_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kontotype</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="asset">Eiendel</SelectItem>
                  <SelectItem value="liability">Gjeld</SelectItem>
                  <SelectItem value="equity">Egenkapital</SelectItem>
                  <SelectItem value="revenue">Inntekt</SelectItem>
                  <SelectItem value="expense">Kostnad</SelectItem>
                </SelectContent>
              </Select>
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
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="analysis_group"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Analysegruppe</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="line_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Linjetype</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="detail">Detaljlinje</SelectItem>
                    <SelectItem value="subtotal">Delsum</SelectItem>
                    <SelectItem value="calculation">Beregning</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="display_order"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Visningsrekkefølge</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="is_total_line"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Summering</FormLabel>
                  <div className="text-sm text-muted-foreground">
                    Er dette en summeringslinje?
                  </div>
                </div>
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="h-4 w-4"
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sign_multiplier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fortegn</FormLabel>
                <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1">Positiv (+)</SelectItem>
                    <SelectItem value="-1">Negativ (-)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="calculation_formula"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Beregningsformel</FormLabel>
              <FormControl>
                <Input {...field} placeholder="f.eks. 19 + 79" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-2">
          <Button type="submit">{defaultValues ? 'Oppdater' : 'Opprett'}</Button>
        </div>
      </form>
    </Form>
  );
};

export default StandardAccountForm;
