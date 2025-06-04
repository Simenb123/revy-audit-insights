
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import FormFieldWrapper from './FormFields/FormFieldWrapper';
import { AuditPhase } from '@/types/revio';

interface ClientDetailsFormProps {
  form: UseFormReturn<any>;
}

const phaseOptions: { value: AuditPhase; label: string }[] = [
  { value: 'overview', label: 'Oversikt' },
  { value: 'engagement', label: 'Oppdragsvurdering' },
  { value: 'planning', label: 'Planlegging' },
  { value: 'execution', label: 'Utførelse' },
  { value: 'conclusion', label: 'Avslutning' },
];

const ClientDetailsForm = ({ form }: ClientDetailsFormProps) => {
  return (
    <div className="space-y-6">
      <FormFieldWrapper form={form} name="companyName" label="Firmanavn" required>
        <Input placeholder="Firmanavn" />
      </FormFieldWrapper>

      <FormFieldWrapper form={form} name="name" label="Selskapsnavn" required>
        <Input placeholder="Selskapsnavn" />
      </FormFieldWrapper>

      <FormFieldWrapper form={form} name="orgNumber" label="Organisasjonsnummer" required>
        <Input placeholder="Organisasjonsnummer (9 siffer)" />
      </FormFieldWrapper>

      <FormFieldWrapper form={form} name="industry" label="Bransje">
        <Input placeholder="Bransje" />
      </FormFieldWrapper>

      <FormFieldWrapper form={form} name="registrationDate" label="Stiftelsesdato">
        <Input type="date" />
      </FormFieldWrapper>

      <FormFieldWrapper form={form} name="phase" label="Revisjonsfase" required>
        <Select
          onValueChange={(value) => form.setValue('phase', value)}
          defaultValue={form.getValues().phase}
        >
          <SelectTrigger>
            <SelectValue placeholder="Velg fase" />
          </SelectTrigger>
          <SelectContent>
            {phaseOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormFieldWrapper>

      <FormFieldWrapper form={form} name="progress" label="Fremdrift (%)" required>
        <Input
          type="number"
          min="0"
          max="100"
        />
      </FormFieldWrapper>
    </div>
  );
};

export default ClientDetailsForm;
