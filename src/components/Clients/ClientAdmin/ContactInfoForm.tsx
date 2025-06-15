
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import FormFieldWrapper from './FormFields/FormFieldWrapper';

interface ContactInfoFormProps {
  form: UseFormReturn<any>;
}

const ContactInfoForm = ({ form }: ContactInfoFormProps) => {
  return (
    <div className="space-y-6">
      <FormFieldWrapper form={form} name="contact_person" label="Kontaktperson">
        <Input placeholder="Kontaktperson" />
      </FormFieldWrapper>

      <FormFieldWrapper form={form} name="chair" label="Styreleder">
        <Input placeholder="Styreleder" />
      </FormFieldWrapper>

      <FormFieldWrapper form={form} name="ceo" label="Daglig leder">
        <Input placeholder="Daglig leder" />
      </FormFieldWrapper>

      <FormFieldWrapper form={form} name="email" label="E-post">
        <Input placeholder="E-post" type="email" />
      </FormFieldWrapper>

      <FormFieldWrapper form={form} name="phone" label="Telefon">
        <Input placeholder="Telefon" />
      </FormFieldWrapper>

      <FormFieldWrapper form={form} name="department" label="Avdeling">
        <Input placeholder="Avdeling" />
      </FormFieldWrapper>
    </div>
  );
};

export default ContactInfoForm;
