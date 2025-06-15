
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import FormFieldWrapper from './FormFields/FormFieldWrapper';

interface AddressFormProps {
  form: UseFormReturn<any>;
}

const AddressForm = ({ form }: AddressFormProps) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FormFieldWrapper form={form} name="address" label="Adresse">
          <Input placeholder="Adresse" />
        </FormFieldWrapper>

        <FormFieldWrapper form={form} name="postal_code" label="Postnummer">
          <Input placeholder="Postnummer" />
        </FormFieldWrapper>

        <FormFieldWrapper form={form} name="city" label="Poststed">
          <Input placeholder="Poststed" />
        </FormFieldWrapper>
      </div>

      <FormFieldWrapper form={form} name="bank_account" label="Bankkontonummer">
        <Input placeholder="Bankkontonummer" />
      </FormFieldWrapper>

      <FormFieldWrapper form={form} name="notes" label="Notater">
        <Textarea
          placeholder="Skriv notater om klienten her..."
          className="min-h-[100px]"
        />
      </FormFieldWrapper>
    </div>
  );
};

export default AddressForm;
