import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Textarea } from '@/components/ui/textarea';
import { 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription 
} from '@/components/ui/form';
import { CreateActionTemplateFormData } from './schema';

interface DetailFieldsProps {
  form: UseFormReturn<CreateActionTemplateFormData>;
}

const DetailFields = ({ form }: DetailFieldsProps) => {
  return (
    <FormField
      control={form.control}
      name="procedures"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Handling *</FormLabel>
          <FormControl>
            <Textarea 
              placeholder="Beskriv handlingen i detalj. Inkluder formål, prosedyrer og hva som skal dokumenteres."
              className="min-h-[120px]"
              {...field} 
            />
          </FormControl>
          <FormDescription>
            Detaljerte instruksjoner for gjennomføring av handlingen
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default DetailFields;
