
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription 
} from '@/components/ui/form';
import { 
  AuditSubjectArea, 
  ActionType, 
  AuditPhase,
  SUBJECT_AREA_LABELS,
  ACTION_TYPE_LABELS 
} from '@/types/audit-actions';
import { useCreateAuditActionTemplate } from '@/hooks/useAuditActions';

const formSchema = z.object({
  name: z.string().min(1, 'Navn er påkrevd'),
  description: z.string().optional(),
  subject_area: z.enum(['sales', 'payroll', 'operating_expenses', 'inventory', 'finance', 'banking', 'fixed_assets', 'receivables', 'payables', 'equity', 'other'] as const),
  action_type: z.enum(['analytical', 'substantive', 'control_test', 'inquiry', 'observation', 'inspection', 'recalculation', 'confirmation'] as const),
  objective: z.string().optional(),
  procedures: z.string().min(1, 'Prosedyrer er påkrevd'),
  documentation_requirements: z.string().optional(),
  estimated_hours: z.number().min(0).optional(),
  risk_level: z.enum(['low', 'medium', 'high']),
  applicable_phases: z.array(z.enum(['engagement', 'planning', 'execution', 'conclusion'] as const)).min(1, 'Minst én fase må velges'),
  sort_order: z.number().default(0)
});

type FormData = z.infer<typeof formSchema>;

interface CreateActionTemplateFormProps {
  selectedArea?: AuditSubjectArea;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const CreateActionTemplateForm = ({ selectedArea, onSuccess, onCancel }: CreateActionTemplateFormProps) => {
  const createTemplate = useCreateAuditActionTemplate();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      subject_area: selectedArea || 'sales',
      action_type: 'substantive',
      objective: '',
      procedures: '',
      documentation_requirements: '',
      estimated_hours: undefined,
      risk_level: 'medium',
      applicable_phases: ['execution'],
      sort_order: 0
    }
  });

  const onSubmit = async (data: FormData) => {
    try {
      await createTemplate.mutateAsync({
        ...data,
        is_system_template: false,
        is_active: true
      });
      
      if (onSuccess) {
        onSuccess();
      }
      form.reset();
    } catch (error) {
      console.error('Error creating template:', error);
    }
  };

  const phaseOptions = [
    { value: 'engagement', label: 'Oppdragsaksept' },
    { value: 'planning', label: 'Planlegging' },
    { value: 'execution', label: 'Gjennomføring' },
    { value: 'conclusion', label: 'Konklusjon' }
  ] as const;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

        <FormField
          control={form.control}
          name="objective"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Formål</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Formålet med handlingen"
                  className="min-h-[60px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="procedures"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prosedyrer *</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Detaljerte prosedyrer for gjennomføring"
                  className="min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="documentation_requirements"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dokumentasjonskrav</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Hva som skal dokumenteres"
                  className="min-h-[60px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="estimated_hours"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estimert tid (timer)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0" 
                    step="0.5"
                    placeholder="0"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sort_order"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sorteringsrekkefølge</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0"
                    placeholder="0"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormDescription>
                  Lavere tall vises først
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="applicable_phases"
          render={() => (
            <FormItem>
              <FormLabel>Anvendelige faser *</FormLabel>
              <FormDescription>
                Velg hvilke faser denne handlingen kan brukes i
              </FormDescription>
              <div className="grid grid-cols-2 gap-4">
                {phaseOptions.map((phase) => (
                  <FormField
                    key={phase.value}
                    control={form.control}
                    name="applicable_phases"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={phase.value}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(phase.value)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, phase.value])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== phase.value
                                      )
                                    )
                              }}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            {phase.label}
                          </FormLabel>
                        </FormItem>
                      )
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={createTemplate.isPending}
            >
              Avbryt
            </Button>
          )}
          <Button
            type="submit"
            disabled={createTemplate.isPending}
          >
            {createTemplate.isPending ? 'Oppretter...' : 'Opprett handling'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CreateActionTemplateForm;
