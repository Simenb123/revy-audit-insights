import React, { useMemo } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage
} from '@/components/ui/form';
import { ACTION_TYPE_LABELS } from '@/types/audit-actions';
import { useSubjectAreaLabels } from '@/hooks/audit-actions/useSubjectAreaLabels';
import { phaseLabels } from '@/constants/phaseLabels';
import { getActionTypesForPhase } from '@/constants/actionTypesByPhase';
import { CreateActionTemplateFormData } from './schema';
import { AuditPhase } from '@/types/revio';

interface BasicFieldsProps {
  form: UseFormReturn<CreateActionTemplateFormData>;
}

const BasicFields = ({ form }: BasicFieldsProps) => {
  const { options: subjectAreaOptions, isLoading } = useSubjectAreaLabels();
  const selectedPhase = form.watch('phase');

  // Filter action types based on selected phase
  const availableActionTypes = useMemo(() => {
    if (!selectedPhase) return [];
    const types = getActionTypesForPhase(selectedPhase as AuditPhase);
    return types.map(type => ({
      value: type,
      label: ACTION_TYPE_LABELS[type]
    }));
  }, [selectedPhase]);

  // Reset action_type when phase changes
  React.useEffect(() => {
    if (selectedPhase && availableActionTypes.length > 0) {
      const currentActionType = form.getValues('action_type');
      if (!availableActionTypes.find(t => t.value === currentActionType)) {
        form.setValue('action_type', availableActionTypes[0].value);
      }
    }
  }, [selectedPhase, availableActionTypes, form]);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="phase"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fase *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg fase" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(phaseLabels)
                    .filter(([key]) => ['engagement', 'planning', 'risk_assessment', 'execution', 'completion', 'reporting'].includes(key))
                    .map(([key, label]) => (
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
          name="action_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Handlingstype *</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                value={field.value}
                disabled={!selectedPhase || availableActionTypes.length === 0}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={!selectedPhase ? "Velg fase først" : "Velg handlingstype"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableActionTypes.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
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
              <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={isLoading ? "Laster..." : "Velg fagområde"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {subjectAreaOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        {option.icon && <span>{option.icon}</span>}
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </>
  );
};

export default BasicFields;
