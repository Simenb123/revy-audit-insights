
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
  phase: z.enum(['engagement', 'planning', 'execution', 'conclusion']),
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
      riskAreas: initialData?.riskAreas || [],
      documents: initialData?.documents || [],
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
