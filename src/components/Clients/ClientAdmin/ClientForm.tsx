
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
  companyName: z.string().min(2, { message: 'Firmanavn må ha minst 2 tegn' }),
  orgNumber: z.string().regex(/^\d{9}$/, { message: 'Organisasjonsnummer må være 9 siffer' }),
  phase: z.enum(['overview', 'engagement', 'planning', 'execution', 'conclusion']),
  progress: z.number().min(0).max(100),
  department: z.string().optional(),
  contactPerson: z.string().optional(),
  chair: z.string().optional(),
  ceo: z.string().optional(),
  industry: z.string().optional(),
  registrationDate: z.string().optional(),
  address: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  email: z.string().email({ message: 'Ugyldig e-postadresse' }).optional().or(z.literal('')),
  phone: z.string().optional(),
  bankAccount: z.string().optional(),
  notes: z.string().optional(),
  // Add the additional required fields for Client
  orgFormCode: z.string().optional(),
  orgFormDescription: z.string().optional(),
  homepage: z.string().optional(),
  status: z.string().optional(),
  naceCode: z.string().optional(),
  naceDescription: z.string().optional(),
  municipalityCode: z.string().optional(),
  municipalityName: z.string().optional(),
  equityCapital: z.number().optional(),
  shareCapital: z.number().optional(),
  // Add the new required fields
  accountingSystem: z.string().optional(),
  previousAuditor: z.string().optional(),
  yearEndDate: z.string().optional(),
  internalControls: z.string().optional(),
  riskAssessment: z.string().optional(),
});

type FormData = z.infer<typeof clientSchema>;

const ClientForm: React.FC<ClientFormProps> = ({ initialData, onSubmit, submitLabel }) => {
  const form = useForm<FormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      id: initialData?.id || Math.random().toString(36).substring(2, 9),
      name: initialData?.name || '',
      companyName: initialData?.companyName || '',
      orgNumber: initialData?.orgNumber || '',
      phase: initialData?.phase || 'engagement',
      progress: initialData?.progress || 0,
      department: initialData?.department || '',
      contactPerson: initialData?.contactPerson || '',
      chair: initialData?.chair || '',
      ceo: initialData?.ceo || '',
      industry: initialData?.industry || '',
      registrationDate: initialData?.registrationDate || '',
      address: initialData?.address || '',
      postalCode: initialData?.postalCode || '',
      city: initialData?.city || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      bankAccount: initialData?.bankAccount || '',
      notes: initialData?.notes || '',
      // Set default values for the new fields
      orgFormCode: initialData?.orgFormCode || '',
      orgFormDescription: initialData?.orgFormDescription || '',
      homepage: initialData?.homepage || '',
      status: initialData?.status || 'ACTIVE',
      naceCode: initialData?.naceCode || '',
      naceDescription: initialData?.naceDescription || '',
      municipalityCode: initialData?.municipalityCode || '',
      municipalityName: initialData?.municipalityName || '',
      equityCapital: initialData?.equityCapital || 0,
      shareCapital: initialData?.shareCapital || 0,
      // Add defaults for new required fields
      accountingSystem: initialData?.accountingSystem || '',
      previousAuditor: initialData?.previousAuditor || '',
      yearEndDate: initialData?.yearEndDate || '',
      internalControls: initialData?.internalControls || '',
      riskAssessment: initialData?.riskAssessment || '',
    },
  });

  const handleSubmit = (data: FormData) => {
    // Ensure all required properties are provided with default values if empty
    const fullClient: Client = {
      id: data.id || Math.random().toString(36).substring(2, 9),
      name: data.name, // This is required by the schema
      companyName: data.companyName, // This is required by the schema
      orgNumber: data.orgNumber, // This is required by the schema
      phase: data.phase, // This is required by the schema
      progress: data.progress, // This is required by the schema
      department: data.department || '',
      contactPerson: data.contactPerson || '',
      chair: data.chair || '',
      ceo: data.ceo || '',
      industry: data.industry || '',
      registrationDate: data.registrationDate || '',
      address: data.address || '',
      postalCode: data.postalCode || '',
      city: data.city || '',
      email: data.email || '',
      phone: data.phone || '',
      bankAccount: data.bankAccount || '',
      notes: data.notes || '',
      // Add the new fields
      orgFormCode: data.orgFormCode || '',
      orgFormDescription: data.orgFormDescription || '',
      homepage: data.homepage || '',
      status: data.status || 'ACTIVE',
      naceCode: data.naceCode || '',
      naceDescription: data.naceDescription || '',
      municipalityCode: data.municipalityCode || '',
      municipalityName: data.municipalityName || '',
      equityCapital: data.equityCapital || 0,
      shareCapital: data.shareCapital || 0,
      // Add the new required fields
      accountingSystem: data.accountingSystem || '',
      previousAuditor: data.previousAuditor || '',
      yearEndDate: data.yearEndDate || '',
      internalControls: data.internalControls || '',
      riskAssessment: data.riskAssessment || '',
      auditFee: initialData?.auditFee || null,
      boardMeetingsPerYear: initialData?.boardMeetingsPerYear || null,
      riskAreas: initialData?.riskAreas || [],
      documents: initialData?.documents || [],
      roles: initialData?.roles || [],
      announcements: initialData?.announcements || [],
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
