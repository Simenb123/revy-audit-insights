
import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Client } from '@/types/revio';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import ClientDetailsForm from './ClientDetailsForm';
import ContactInfoForm from './ContactInfoForm';
import AddressForm from './AddressForm';

interface ClientFormProps {
  initialData?: Partial<Client>;
  onSubmit: (data: Client) => void;
  submitLabel: string;
}

const clientSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, { message: 'Selskapsnavn må ha minst 2 tegn' }),
  company_name: z.string().min(2, { message: 'Firmanavn må ha minst 2 tegn' }),
  org_number: z.string().regex(/^\d{9}$/, { message: 'Organisasjonsnummer må være 9 siffer' }),
  phase: z.enum(['overview', 'engagement', 'planning', 'risk_assessment', 'execution', 'completion']),
  progress: z.number().min(0).max(100),
  department: z.string().optional(),
  contact_person: z.string().optional(),
  chair: z.string().optional(),
  ceo: z.string().optional(),
  industry: z.string().optional(),
  registration_date: z.string().optional(),
  address: z.string().optional(),
  postal_code: z.string().optional(),
  city: z.string().optional(),
  email: z.string().email({ message: 'Ugyldig e-postadresse' }).optional().or(z.literal('')),
  phone: z.string().optional(),
  bank_account: z.string().optional(),
  notes: z.string().optional(),
  org_form_code: z.string().optional(),
  org_form_description: z.string().optional(),
  homepage: z.string().optional(),
  status: z.string().optional(),
  nace_code: z.string().optional(),
  nace_description: z.string().optional(),
  municipality_code: z.string().optional(),
  municipality_name: z.string().optional(),
  equity_capital: z.number().optional().nullable(),
  share_capital: z.number().optional().nullable(),
  accounting_system: z.string().optional(),
  previous_auditor: z.string().optional(),
  year_end_date: z.string().optional(),
  internal_controls: z.string().optional(),
  risk_assessment: z.string().optional(),
});

type FormData = z.infer<typeof clientSchema>;

const ClientForm: React.FC<ClientFormProps> = ({ initialData, onSubmit, submitLabel }) => {
  const form = useForm<FormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      id: initialData?.id || Math.random().toString(36).substring(2, 9),
      name: initialData?.name || '',
      company_name: initialData?.company_name || '',
      org_number: initialData?.org_number || '',
      phase: initialData?.phase || 'engagement',
      progress: initialData?.progress || 0,
      department: initialData?.department || '',
      contact_person: initialData?.contact_person || '',
      chair: initialData?.chair || '',
      ceo: initialData?.ceo || '',
      industry: initialData?.industry || '',
      registration_date: initialData?.registration_date || '',
      address: initialData?.address || '',
      postal_code: initialData?.postal_code || '',
      city: initialData?.city || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      bank_account: initialData?.bank_account || '',
      notes: initialData?.notes || '',
      org_form_code: initialData?.org_form_code || '',
      org_form_description: initialData?.org_form_description || '',
      homepage: initialData?.homepage || '',
      status: initialData?.status || 'ACTIVE',
      nace_code: initialData?.nace_code || '',
      nace_description: initialData?.nace_description || '',
      municipality_code: initialData?.municipality_code || '',
      municipality_name: initialData?.municipality_name || '',
      equity_capital: initialData?.equity_capital || 0,
      share_capital: initialData?.share_capital || 0,
      accounting_system: initialData?.accounting_system || '',
      previous_auditor: initialData?.previous_auditor || '',
      year_end_date: initialData?.year_end_date || '',
      internal_controls: initialData?.internal_controls || '',
      risk_assessment: initialData?.risk_assessment || '',
    },
  });

  const handleSubmit = (data: FormData) => {
    const now = new Date().toISOString();
    
    const fullClient: Client = {
      id: data.id || Math.random().toString(36).substring(2, 9),
      name: data.name,
      company_name: data.company_name,
      org_number: data.org_number,
      phase: data.phase,
      progress: data.progress,
      department: data.department || '',
      contact_person: data.contact_person || '',
      chair: data.chair || '',
      ceo: data.ceo || '',
      industry: data.industry || '',
      registration_date: data.registration_date || '',
      address: data.address || '',
      postal_code: data.postal_code || '',
      city: data.city || '',
      email: data.email || '',
      phone: data.phone || '',
      bank_account: data.bank_account || '',
      notes: data.notes || '',
      org_form_code: data.org_form_code || '',
      org_form_description: data.org_form_description || '',
      homepage: data.homepage || '',
      status: data.status || 'ACTIVE',
      nace_code: data.nace_code || '',
      nace_description: data.nace_description || '',
      municipality_code: data.municipality_code || '',
      municipality_name: data.municipality_name || '',
      equity_capital: data.equity_capital || null,
      share_capital: data.share_capital || null,
      accounting_system: data.accounting_system || '',
      previous_auditor: data.previous_auditor || '',
      year_end_date: data.year_end_date || '',
      internal_controls: data.internal_controls || '',
      risk_assessment: data.risk_assessment || '',
      audit_fee: initialData?.audit_fee || null,
      board_meetings_per_year: initialData?.board_meetings_per_year || null,
      riskAreas: initialData?.riskAreas || [],
      documents: initialData?.documents || [],
      roles: initialData?.roles || [],
      announcements: initialData?.announcements || [],
      created_at: initialData?.created_at || now,
      updated_at: now,
    };
    
    onSubmit(fullClient);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ClientDetailsForm form={form} />
          <ContactInfoForm form={form} />
        </div>
        
        <AddressForm form={form} />
        
        <div className="flex justify-end">
          <Button type="submit">{submitLabel}</Button>
        </div>
      </form>
    </Form>
  );
};

export default ClientForm;
