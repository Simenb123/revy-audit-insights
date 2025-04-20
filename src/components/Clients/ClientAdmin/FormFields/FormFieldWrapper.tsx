
import React from 'react';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { UseFormReturn } from 'react-hook-form';

interface FormFieldWrapperProps {
  form: UseFormReturn<any>;
  name: string;
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

const FormFieldWrapper = ({ form, name, label, required, children }: FormFieldWrapperProps) => {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label} {required && '*'}</FormLabel>
          <FormControl>
            {React.cloneElement(children as React.ReactElement, { ...field })}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default FormFieldWrapper;
