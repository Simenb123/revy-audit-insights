import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { AuditPhase } from '@/types/revio';
import { ActionType, ACTION_TYPE_LABELS, RiskLevel, ClientAuditAction, AuditSubjectArea } from '@/types/audit-actions';
import { useCreateClientAuditAction } from '@/hooks/useAuditActions';
import { RISK_LEVEL_CONFIG, ACTION_TYPE_CONFIG } from '@/constants/actionConfig';

interface NewActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  selectedArea?: AuditSubjectArea | string;
  phase: AuditPhase | string;
  nextSortOrder: number;
  onCreated?: (action: ClientAuditAction) => void;
}

interface FormValues {
  name: string;
  action_type: ActionType;
  risk_level: RiskLevel;
  due_date?: string;
  estimated_hours?: number;
  description?: string;
  procedures: string;
}

const NewActionDialog: React.FC<NewActionDialogProps> = ({
  open,
  onOpenChange,
  clientId,
  selectedArea,
  phase,
  nextSortOrder,
  onCreated,
}) => {
  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: {
      action_type: 'substantive',
      risk_level: 'medium',
    } as Partial<FormValues>,
  });

  const createMutation = useCreateClientAuditAction();

  const buildPayload = (values: FormValues): Omit<ClientAuditAction, 'id' | 'created_at' | 'updated_at'> => ({
    client_id: clientId,
    template_id: null,
    assigned_to: null,
    reviewed_by: null,
    subject_area: (selectedArea || 'general') as AuditSubjectArea,
    action_type: values.action_type,
    status: 'not_started',
    phase: phase as AuditPhase,
    sort_order: nextSortOrder,
    due_date: values.due_date ? new Date(values.due_date).toISOString() : null,
    completed_at: null,
    reviewed_at: null,
    actual_hours: null,
    name: values.name,
    description: values.description || null,
    objective: null,
    procedures: values.procedures,
    documentation_requirements: null,
    estimated_hours: values.estimated_hours ? Number(values.estimated_hours) : null,
    risk_level: values.risk_level,
    findings: null,
    conclusion: null,
    work_notes: null,
    working_paper_template_id: null,
    working_paper_data: null,
    auto_metrics: null,
    copied_from_client_id: null,
    copied_from_action_id: null,
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const payload = buildPayload(values);
      await createMutation.mutateAsync(payload);
      toast.success('Handling opprettet');
      reset();
      onOpenChange(false);
    } catch (e) {
      toast.error('Kunne ikke opprette handling');
    }
  };

  const onSubmitAndOpen = async (values: FormValues) => {
    try {
      const payload = buildPayload(values);
      const created = await createMutation.mutateAsync(payload);
      toast.success('Handling opprettet');
      reset();
      onOpenChange(false);
      if (created && typeof (onCreated) === 'function') {
        onCreated(created as ClientAuditAction);
      }
    } catch (e) {
      toast.error('Kunne ikke opprette handling');
    }
  };

  const closeAndReset = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  return (
    <Dialog open={open} onOpenChange={closeAndReset}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ny handling</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm">Navn</label>
            <Input {...register('name', { required: true })} placeholder="Gi handlingen et navn" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm">Metodikk</label>
              <select {...register('action_type', { required: true })} className="px-3 py-2 border rounded-md bg-background w-full">
                {(Object.keys(ACTION_TYPE_CONFIG) as ActionType[]).map((t) => (
                  <option key={t} value={t}>
                    {ACTION_TYPE_CONFIG[t] || ACTION_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm">Risikograd</label>
              <select {...register('risk_level', { required: true })} className="px-3 py-2 border rounded-md bg-background w-full">
                {(Object.keys(RISK_LEVEL_CONFIG) as RiskLevel[]).map((r) => (
                  <option key={r} value={r}>
                    {RISK_LEVEL_CONFIG[r].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm">Forfallsdato</label>
              <Input type="date" {...register('due_date')} />
            </div>
            <div className="space-y-2">
              <label className="text-sm">Estimert timer</label>
              <Input type="number" step="0.25" min={0} {...register('estimated_hours')} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm">Beskrivelse</label>
            <Textarea {...register('description')} placeholder="Kort beskrivelse (valgfritt)" />
          </div>

          <div className="space-y-2">
            <label className="text-sm">Prosedyrer</label>
            <Textarea {...register('procedures', { required: true })} placeholder="Hva skal gjøres?" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => closeAndReset(false)}>
              Avbryt
            </Button>
            <Button type="button" variant="secondary" disabled={createMutation.isPending} onClick={handleSubmit(onSubmitAndOpen)}>
              Opprett og åpne
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              Opprett
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewActionDialog;
