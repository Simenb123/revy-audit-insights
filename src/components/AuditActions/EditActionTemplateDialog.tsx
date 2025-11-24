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
    resolver: zodResolver(createActionTemplateFormSchema),
    defaultValues: {
      name: template.name,
      description: template.description || '',
      subject_area: template.subject_area,
      action_type: template.action_type,
      objective: template.objective || '',
      procedures: template.procedures,
      documentation_requirements: template.documentation_requirements || '',
      estimated_hours: template.estimated_hours || 0,
      risk_level: template.risk_level as 'low' | 'medium' | 'high',
      applicable_phases: template.applicable_phases || ['execution'],
      sort_order: template.sort_order || 0
    }
  });

  const onSubmit = async (data: CreateActionTemplateFormData) => {
    try {
      await updateTemplate.mutateAsync({
        id: template.id,
        ...data
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
            <PhaseSelection form={form} />

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
