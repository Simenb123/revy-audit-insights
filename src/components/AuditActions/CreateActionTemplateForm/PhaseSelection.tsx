
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription 
} from '@/components/ui/form';
import { AuditPhase } from '@/types/revio';
import { CreateActionTemplateFormData } from './types';

interface PhaseSelectionProps {
  form: UseFormReturn<CreateActionTemplateFormData>;
}

const PhaseSelection = ({ form }: PhaseSelectionProps) => {
  const phaseOptions: { value: AuditPhase; label: string }[] = [
    { value: 'engagement', label: 'Oppdragsaksept' },
    { value: 'planning', label: 'Planlegging' },
    { value: 'execution', label: 'Gjennomføring' },
    { value: 'completion', label: 'Avslutning' }
  ];

  return (
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
  );
};

export default PhaseSelection;
