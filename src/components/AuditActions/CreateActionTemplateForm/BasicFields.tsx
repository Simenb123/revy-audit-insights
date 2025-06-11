
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription 
} from '@/components/ui/form';
import { 
  SUBJECT_AREA_LABELS,
  ACTION_TYPE_LABELS 
} from '@/types/audit-actions';
import { CreateActionTemplateFormData } from './types';

interface BasicFieldsProps {
  form: UseFormReturn<CreateActionTemplateFormData>;
}

const BasicFields = ({ form }: BasicFieldsProps) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Navn *</FormLabel>
              <FormControl>
                <Input placeholder="Navn på handlingen" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="subject_area"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fagområde *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg fagområde" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(SUBJECT_AREA_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="action_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Handlingstype *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg handlingstype" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(ACTION_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="risk_level"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Risikonivå *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg risikonivå" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="low">Lav</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">Høy</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Beskrivelse</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Kort beskrivelse av handlingen"
                className="min-h-[60px]"
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};

export default BasicFields;
