import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { SimpleFormulaBuilder, SimpleFormulaData } from './SimpleFormulaBuilder';
import { useStandardAccounts } from '@/hooks/useChartOfAccounts';

const accountSchema = z.object({
  id: z.string().optional(),
  standard_number: z.string().min(1, 'Kontonummer er påkrevd'),
  standard_name: z.string().min(1, 'Kontonavn er påkrevd'),
  account_type: z.enum(['eiendeler', 'gjeld', 'egenkapital', 'resultat']),
  category: z.string().optional(),
  analysis_group: z.string().optional(),
  line_type: z.enum(['detail', 'subtotal', 'calculation']).default('detail'),
  display_order: z.number().default(0),
  is_total_line: z.boolean().default(false),
  sign_multiplier: z.number().default(1),
  parent_line_id: z.string().optional().nullable(),
  calculation_formula: z.union([
    z.object({
      type: z.literal('formula'),
      terms: z.array(z.object({
        id: z.string(),
        account_number: z.string(),
        account_name: z.string(),
        operator: z.enum(['+', '-']),
      }))
    }).strict(),
    z.null()
  ]).optional().nullable(),
}).refine((data) => {
  // Require calculation formula only for calculation or subtotal line types
  if ((data.line_type === 'calculation' || data.line_type === 'subtotal') && !data.calculation_formula) {
    return false;
  }
  return true;
}, {
  message: 'Beregningsformel er påkrevd for beregnings- og delsumlinjer',
  path: ['calculation_formula'],
});

export type StandardAccountFormData = z.infer<typeof accountSchema>;

interface StandardAccountFormProps {
  defaultValues?: StandardAccountFormData | null;
  onSubmit: (data: StandardAccountFormData) => void;
}

const StandardAccountForm = ({ defaultValues, onSubmit }: StandardAccountFormProps) => {
  const { data: standardAccounts = [] } = useStandardAccounts();
  
  // Check if we're editing - only true if defaultValues exists with valid id and standard_number
  const isEditing = Boolean(defaultValues && defaultValues.id && defaultValues.standard_number);
  
  const form = useForm<StandardAccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: defaultValues || {
      standard_number: '',
      standard_name: '',
      account_type: 'eiendeler',
      category: '',
      analysis_group: 'balance_sheet',
      line_type: 'detail',
      display_order: 0,
      is_total_line: false,
      sign_multiplier: 1,
      parent_line_id: null,
      calculation_formula: null,
    },
  });

  // Reset form when defaultValues changes (especially when switching between create/edit)
  React.useEffect(() => {
    if (defaultValues) {
      form.reset(defaultValues);
    } else {
      form.reset({
        standard_number: '',
        standard_name: '',
        account_type: 'eiendeler',
        category: '',
        analysis_group: 'balance_sheet',
        line_type: 'detail',
        display_order: 0,
        is_total_line: false,
        sign_multiplier: 1,
        parent_line_id: null,
        calculation_formula: null,
      });
    }
  }, [defaultValues, form]);

  // Watch for changes in standard_number to auto-calculate display_order
  const standardNumber = form.watch('standard_number');
  const lineType = form.watch('line_type');

  React.useEffect(() => {
    if (standardNumber && /^\d+$/.test(standardNumber)) {
      const displayOrder = parseInt(standardNumber);
      if (form.getValues('display_order') === 0 || form.getValues('display_order') === displayOrder) {
        form.setValue('display_order', displayOrder);
      }
    }
  }, [standardNumber, form]);

  const handleSubmit = async (data: StandardAccountFormData) => {
    try {
      // Format the data properly for submission
      const formattedData = {
        ...data,
        display_order: Number(data.display_order),
        sign_multiplier: Number(data.sign_multiplier),
        is_total_line: Boolean(data.is_total_line),
      };
      
      await onSubmit(formattedData);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        
        {/* Account Type and Line Settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="account_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kontotype</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="eiendeler">Eiendel</SelectItem>
                    <SelectItem value="gjeld">Gjeld</SelectItem>
                    <SelectItem value="egenkapital">Egenkapital</SelectItem>
                    <SelectItem value="resultat">Inntekt/Kostnad</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="line_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Linjetype</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
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

        {/* Advanced Settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="is_total_line"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-2">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="h-4 w-4"
                  />
                </FormControl>
                <FormLabel className="text-sm font-normal">Sumlinje</FormLabel>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sign_multiplier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fortegn</FormLabel>
                <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
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

        {/* Calculation Formula - Only show for calculation and subtotal lines */}
        {(lineType === 'calculation' || lineType === 'subtotal') && (
          <FormField
            control={form.control}
            name="calculation_formula"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Beregningsformel (påkrevd)
                </FormLabel>
                <FormControl>
                  <SimpleFormulaBuilder
                    value={field.value as SimpleFormulaData | null}
                    onChange={field.onChange}
                    standardAccounts={standardAccounts.map(acc => ({
                      standard_number: acc.standard_number,
                      standard_name: acc.standard_name
                    }))}
                  />
                </FormControl>
                <FormDescription>
                  Legg til kontoer som skal summeres eller trekkes fra for denne linjen.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex gap-2 pt-4">
          <Button type="submit">{isEditing ? 'Oppdater' : 'Opprett'}</Button>
        </div>
      </form>
    </Form>
  );
};

export default StandardAccountForm;
