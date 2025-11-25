import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import { useUpdateAuditActionTemplate } from '@/hooks/audit-actions/useActionTemplateCRUD';
import { Form } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import BasicFields from '@/components/AuditActions/CreateActionTemplateForm/BasicFields';
import DetailFields from '@/components/AuditActions/CreateActionTemplateForm/DetailFields';
import { createActionTemplateSchema, type CreateActionTemplateFormData } from '@/components/AuditActions/CreateActionTemplateForm/schema';
import { toast } from '@/hooks/use-toast';
import type { AuditActionTemplate } from '@/types/audit-actions';
import { logger } from '@/utils/logger';

interface EditActionTemplateDialogProps {
  template: AuditActionTemplate;
  trigger?: React.ReactNode;
}

const EditActionTemplateDialog = ({ template, trigger }: EditActionTemplateDialogProps) => {
  const [open, setOpen] = useState(false);
  const updateTemplate = useUpdateAuditActionTemplate();
  
  const form = useForm<CreateActionTemplateFormData>({
    resolver: zodResolver(createActionTemplateSchema),
    defaultValues: {
      phase: (template.applicable_phases?.[0] || 'execution') as any,
      name: template.name,
      subject_area: template.subject_area,
      action_type: template.action_type,
      procedures: template.procedures,
      response_fields: template.response_fields || []
    }
  });

  const onSubmit = async (data: CreateActionTemplateFormData) => {
    try {
      await updateTemplate.mutateAsync({
        id: template.id,
        name: data.name,
        subject_area: data.subject_area,
        action_type: data.action_type,
        procedures: data.procedures,
        applicable_phases: [data.phase],
        response_fields: data.response_fields || [],
        description: '',
        objective: '',
        documentation_requirements: '',
        risk_level: 'medium',
        estimated_hours: template.estimated_hours,
        sort_order: template.sort_order || 0
      });
      
      setOpen(false);
      toast({
        title: "Mal oppdatert",
        description: "Revisjonshandlingsmalen er oppdatert.",
      });
    } catch (error) {
      logger.error('Error updating template:', error);
      toast({
        title: "Feil ved oppdatering",
        description: "Kunne ikke oppdatere malen. Prøv igjen.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <div onClick={() => setOpen(true)} className="cursor-pointer">
          {trigger}
        </div>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
          <Edit className="w-4 h-4" />
        </Button>
      )}
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rediger revisjonshandlingsmal</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <BasicFields form={form} />
            <DetailFields form={form} />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={updateTemplate.isPending}
              >
                Avbryt
              </Button>
              <Button
                type="submit"
                disabled={updateTemplate.isPending}
              >
                {updateTemplate.isPending ? 'Oppdaterer...' : 'Oppdater handling'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditActionTemplateDialog;
