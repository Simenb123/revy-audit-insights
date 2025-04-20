import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Client, AuditPhase } from '@/types/revio';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ClientFormProps {
  initialData?: Partial<Client>;
  onSubmit: (data: Client) => void;
  submitLabel: string;
}

// Valideringsschema for skjemaet
const clientSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, { message: 'Selskapsnavn må ha minst 2 tegn' }),
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

// Vi må gjøre Client typen delvis for skjemadataene siden noen felt er obligatoriske i Client-interfacet
type FormData = z.infer<typeof clientSchema>;

const phaseOptions: { value: AuditPhase; label: string }[] = [
  { value: 'engagement', label: 'Oppdragsvurdering' },
  { value: 'planning', label: 'Planlegging' },
  { value: 'execution', label: 'Utførelse' },
  { value: 'conclusion', label: 'Avslutning' },
];

const ClientForm: React.FC<ClientFormProps> = ({ initialData, onSubmit, submitLabel }) => {
  const form = useForm<FormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      id: initialData?.id || Math.random().toString(36).substring(2, 9),
      name: initialData?.name || '',
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
    // Ensuring all required fields are included and not optional in the fullClient object
    const fullClient: Client = {
      id: data.id || Math.random().toString(36).substring(2, 9),
      name: data.name, // This is required and now explicitly assigned
      orgNumber: data.orgNumber, // This is required and now explicitly assigned
      phase: data.phase, // This is required and now explicitly assigned
      progress: data.progress, // This is required and now explicitly assigned
      department: data.department,
      contactPerson: data.contactPerson,
      chair: data.chair,
      ceo: data.ceo,
      industry: data.industry,
      registrationDate: data.registrationDate,
      address: data.address,
      postalCode: data.postalCode,
      city: data.city,
      email: data.email || undefined,
      phone: data.phone,
      bankAccount: data.bankAccount,
      notes: data.notes,
      riskAreas: initialData?.riskAreas || [],
      documents: initialData?.documents || [],
    };
    
    onSubmit(fullClient);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Selskapsnavn *</FormLabel>
                  <FormControl>
                    <Input placeholder="Selskapsnavn" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="orgNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organisasjonsnummer *</FormLabel>
                  <FormControl>
                    <Input placeholder="Organisasjonsnummer (9 siffer)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bransje</FormLabel>
                  <FormControl>
                    <Input placeholder="Bransje" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="registrationDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stiftelsesdato</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phase"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Revisjonsfase *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Velg fase" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {phaseOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
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
              name="progress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fremdrift (%) *</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0" 
                      max="100" 
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="contactPerson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kontaktperson</FormLabel>
                  <FormControl>
                    <Input placeholder="Kontaktperson" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="chair"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Styreleder</FormLabel>
                  <FormControl>
                    <Input placeholder="Styreleder" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="ceo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Daglig leder</FormLabel>
                  <FormControl>
                    <Input placeholder="Daglig leder" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-post</FormLabel>
                  <FormControl>
                    <Input placeholder="E-post" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefon</FormLabel>
                  <FormControl>
                    <Input placeholder="Telefon" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avdeling</FormLabel>
                  <FormControl>
                    <Input placeholder="Avdeling" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Adresse</FormLabel>
                <FormControl>
                  <Input placeholder="Adresse" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="postalCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Postnummer</FormLabel>
                <FormControl>
                  <Input placeholder="Postnummer" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Poststed</FormLabel>
                <FormControl>
                  <Input placeholder="Poststed" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="bankAccount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bankkontonummer</FormLabel>
              <FormControl>
                <Input placeholder="Bankkontonummer" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notater</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Skriv notater om klienten her..." 
                  className="min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end">
          <Button type="submit">{submitLabel}</Button>
        </div>
      </form>
    </Form>
  );
};

export default ClientForm;
