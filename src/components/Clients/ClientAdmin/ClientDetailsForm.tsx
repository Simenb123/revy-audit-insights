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
import { phaseLabels } from '@/constants/phaseLabels';

interface ClientDetailsFormProps {
  form: UseFormReturn<any>;
}

const phaseOptions: { value: AuditPhase; label: string }[] = Object.entries(
  phaseLabels
).map(([value, label]) => ({ value: value as AuditPhase, label }));

const ClientDetailsForm = ({ form }: ClientDetailsFormProps) => {
  return (
    <div className="space-y-6">
      <FormFieldWrapper form={form} name="company_name" label="Firmanavn" required>
        <Input placeholder="Firmanavn" />
      </FormFieldWrapper>

      <FormFieldWrapper form={form} name="name" label="Selskapsnavn" required>
        <Input placeholder="Selskapsnavn" />
      </FormFieldWrapper>

      <FormFieldWrapper form={form} name="org_number" label="Organisasjonsnummer" required>
        <Input placeholder="Organisasjonsnummer (9 siffer)" />
      </FormFieldWrapper>

      <FormFieldWrapper form={form} name="industry" label="Bransje">
        <Input placeholder="Bransje" />
      </FormFieldWrapper>

      <FormFieldWrapper form={form} name="registration_date" label="Stiftelsesdato">
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

      <FormFieldWrapper form={form} name="engagement_type" label="Oppdragstype">
        <Select
          onValueChange={(value) => form.setValue('engagement_type', value)}
          defaultValue={form.getValues().engagement_type}
        >
          <SelectTrigger>
            <SelectValue placeholder="Velg oppdragstype" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Revisjon">Revisjon</SelectItem>
            <SelectItem value="Regnskap">Regnskap</SelectItem>
            <SelectItem value="Annet">Annet</SelectItem>
          </SelectContent>
        </Select>
      </FormFieldWrapper>
    </div>
  );
};

export default ClientDetailsForm;
