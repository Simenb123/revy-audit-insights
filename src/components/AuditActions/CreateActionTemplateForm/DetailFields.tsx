
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription 
} from '@/components/ui/form';
import { CreateActionTemplateFormData } from './types';

interface DetailFieldsProps {
  form: UseFormReturn<CreateActionTemplateFormData>;
}

const DetailFields = ({ form }: DetailFieldsProps) => {
  return (
    <>
      <FormField
        control={form.control}
        name="objective"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Formål</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Formålet med handlingen"
                className="min-h-[60px]"
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="procedures"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Prosedyrer *</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Detaljerte prosedyrer for gjennomføring"
                className="min-h-[100px]"
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="documentation_requirements"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Dokumentasjonskrav</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Hva som skal dokumenteres"
                className="min-h-[60px]"
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="estimated_hours"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estimert tid (timer)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min="0" 
                  step="0.5"
                  placeholder="0"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sort_order"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sorteringsrekkefølge</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min="0"
                  placeholder="0"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                />
              </FormControl>
              <FormDescription>
                Lavere tall vises først
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </>
  );
};

export default DetailFields;
