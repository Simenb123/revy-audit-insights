import { logger } from '@/utils/logger';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AuditSubjectArea } from '@/types/audit-actions';
import { useCreateAuditActionTemplate } from '@/hooks/audit-actions/useActionTemplateCRUD';
import { createActionTemplateFormSchema, CreateActionTemplateFormData } from './CreateActionTemplateForm/types';
import BasicFields from './CreateActionTemplateForm/BasicFields';
import DetailFields from './CreateActionTemplateForm/DetailFields';
import PhaseSelection from './CreateActionTemplateForm/PhaseSelection';

interface ImprovedCreateActionTemplateFormProps {
  selectedArea?: AuditSubjectArea;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const ImprovedCreateActionTemplateForm = ({ 
  selectedArea, 
  onSuccess, 
  onCancel 
}: ImprovedCreateActionTemplateFormProps) => {
  const createTemplate = useCreateAuditActionTemplate();

  const form = useForm<CreateActionTemplateFormData>({
    resolver: zodResolver(createActionTemplateFormSchema),
    defaultValues: {
      name: '',
      description: '',
      subject_area: selectedArea || '',
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

  const onSubmit = async (data: CreateActionTemplateFormData) => {
    logger.log('🔄 Submitting audit action template:', data);
    
    try {
      // Ensure all required fields are present for the template
      const templateData = {
        name: data.name.trim(),
        description: data.description?.trim() || '',
        subject_area: data.subject_area,
        action_type: data.action_type,
        objective: data.objective?.trim() || '',
        procedures: data.procedures.trim(),
        documentation_requirements: data.documentation_requirements?.trim() || '',
        estimated_hours: data.estimated_hours,
        risk_level: data.risk_level,
        applicable_phases: data.applicable_phases as any, // Type assertion for compatibility
        sort_order: data.sort_order,
        is_system_template: false,
        is_active: true
      };
      
      logger.log('📝 Template data to submit:', templateData);
      
      await createTemplate.mutateAsync(templateData);
      
      if (onSuccess) {
        onSuccess();
      }
      form.reset();
    } catch (error) {
      logger.error('❌ Error creating template:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Opprett ny revisjonshandling</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <BasicFields form={form} />
            <DetailFields form={form} />
            <PhaseSelection form={form} />

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
      </CardContent>
    </Card>
  );
};

export default ImprovedCreateActionTemplateForm;
