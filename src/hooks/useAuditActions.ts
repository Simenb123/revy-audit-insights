import { logger } from '@/utils/logger';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { toast } from '@/hooks/use-toast';
import { ClientAuditAction, ActionGroup, AuditSubjectArea } from '@/types/audit-actions';
import { AuditPhase } from '@/types/revio';
export {
  useAuditActionTemplates,
  useCreateAuditActionTemplate,
  useUpdateAuditActionTemplate,
  useDeleteAuditActionTemplate
} from '@/hooks/audit-actions/useActionTemplateCRUD';

export const mapPhaseToDb = (
  phase: AuditPhase
): Database['public']['Enums']['audit_phase'] => {
  if (phase === 'completion') return 'conclusion';
  if (phase === 'risk_assessment') return 'planning';
  if (phase === 'overview') return 'engagement';
  if (phase === 'reporting') return 'conclusion';
  return phase as Database['public']['Enums']['audit_phase'];
};


export function useActionGroups() {
  return useQuery({
    queryKey: ['action-groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('action_groups')
        .select('*')
        .order('subject_area, sort_order');

      if (error) {
        logger.error('Error fetching action groups:', error);
        throw error;
      }

      return data as ActionGroup[];
    }
  });
}

export function useClientAuditActions(clientId: string) {
  return useQuery({
    queryKey: ['client-audit-actions', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_audit_actions')
        .select('*')
        .eq('client_id', clientId)
        .order('subject_area, sort_order');

      if (error) {
        logger.error('Error fetching client audit actions:', error);
        throw error;
      }

      return data as ClientAuditAction[];
    },
    enabled: !!clientId
  });
}


export function useCreateClientAuditAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      action: Omit<ClientAuditAction, 'id' | 'created_at' | 'updated_at'>
    ) => {
      const dbAction = {
        ...action,
        phase: mapPhaseToDb(action.phase)
      };
      const { data, error } = await supabase
        .from('client_audit_actions')
        .insert(dbAction)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client-audit-actions', variables.client_id] });
      toast({
        title: "Handling opprettet",
        description: "Den nye handlingen er lagt til i revisjonsplanen.",
      });
    },
    onError: (error) => {
      logger.error('Error creating client audit action:', error);
      toast({
        title: "Feil ved opprettelse",
        description: "Kunne ikke opprette handlingen.",
        variant: "destructive",
      });
    }
  });
}

export function useUpdateClientAuditAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ClientAuditAction> }) => {
      const dbUpdates: Database['public']['Tables']['client_audit_actions']['Update'] = {
        ...(updates as Database['public']['Tables']['client_audit_actions']['Update'])
      };
      if (updates.phase) {
        dbUpdates.phase = mapPhaseToDb(updates.phase);
      }
      const { data, error } = await supabase
        .from('client_audit_actions')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-audit-actions', data.client_id] });
      toast({
        title: "Handling oppdatert",
        description: "Handlingen er oppdatert.",
      });
    },
    onError: (error) => {
      logger.error('Error updating client audit action:', error);
      toast({
        title: "Feil ved oppdatering",
        description: "Kunne ikke oppdatere handlingen.",
        variant: "destructive",
      });
    }
  });
}

export function useCopyActionsFromTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clientId, templateIds, phase }: {
      clientId: string;
      templateIds: string[];
      phase: string;
    }) => {
      // First fetch the templates
      const { data: templates, error: templatesError } = await supabase
        .from('audit_action_templates')
        .select('*')
        .in('id', templateIds);

      if (templatesError) throw templatesError;

      // Convert templates to client actions
      const clientActions = templates.map(template => ({
        client_id: clientId,
        template_id: template.id,
        subject_area: template.subject_area,
        action_type: template.action_type,
        phase: mapPhaseToDb(phase as AuditPhase),
        name: template.name,
        description: template.description,
        objective: template.objective,
        procedures: template.procedures,
        documentation_requirements: template.documentation_requirements,
        estimated_hours: template.estimated_hours,
        risk_level: template.risk_level,
        sort_order: template.sort_order,
        status: 'not_started' as const
      }));

      const { data, error } = await supabase
        .from('client_audit_actions')
        .insert(clientActions)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client-audit-actions', variables.clientId] });
      toast({
        title: "Handlinger kopiert",
        description: `${data.length} handlinger er lagt til i revisjonsplanen.`,
      });
    },
    onError: (error) => {
      logger.error('Error copying actions from template:', error);
      toast({
        title: "Feil ved kopiering",
        description: "Kunne ikke kopiere handlingene.",
        variant: "destructive",
      });
    }
  });
}

export function useApplyStandardPackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clientId, phase }: { clientId: string; phase: AuditPhase }) => {
      const phaseDb = mapPhaseToDb(phase);

      const engagementItems = [
        {
          name: 'Vurdering av finansielt rammeverk (NGAAP)',
          description: 'Bekreft at valgt regnskapsprinsipp er akseptabelt for enheten. Terskelverdier kan beregnes fra saldobalanse.',
          subject_area: 'finance' as const,
          action_type: 'analytical' as const,
          risk_level: 'high',
          procedures: [
            '- [ ] Identifiser valgt rammeverk (NGAAP/IFRS) og begrunnelse',
            '- [ ] Hent nøkkeltall fra siste saldobalanse (omsetning, totalkapital)',
            '- [ ] Sammenlign mot terskelverdier i NGAAP',
            '- [ ] Vurder behov for avvikshåndtering',
            '',
            'Resultat: Dokumenter vurdering og konklusjon. '
          ].join('\n')
        },
        {
          name: 'Kompetanse, uavhengighet og ressurser i teamet',
          description: 'Vurder teamets uavhengighet, kompetanse og kapasitet for oppdraget.',
          subject_area: 'other' as const,
          action_type: 'inquiry' as const,
          risk_level: 'medium',
          procedures: [
            '- [ ] Uavhengighetserklæring fra alle teammedlemmer',
            '- [ ] Kartlegg relevant erfaring og kompetanse',
            '- [ ] Vurder ressursbehov vs. tilgjengelige ressurser',
            '',
            'Resultat: Oppsummer vurdering og eventuelle tiltak.'
          ].join('\n')
        },
        {
          name: 'Organisasjons- og eierstruktur (forberedelse)',
          description: 'Innhent og dokumenter organisasjonskart og eierstruktur. Forbereder senere automatikk mot aksjonærregisteret.',
          subject_area: 'other' as const,
          action_type: 'inquiry' as const,
          risk_level: 'medium',
          procedures: [
            '- [ ] Innhent organisasjonskart/eierstruktur',
            '- [ ] Identifiser nøkkelpersoner og roller',
            '- [ ] Vurder behov for videre innhenting',
            '',
            'Resultat: Last opp dokumentasjon og oppsummer.'
          ].join('\n')
        },
        {
          name: 'Engasjementsbrev – forhåndsbetingelser',
          description: 'Sørg for at engasjementsbrev er utarbeidet og godkjent. Kan senere genereres fra mal og sendes til signering.',
          subject_area: 'other' as const,
          action_type: 'inspection' as const,
          risk_level: 'high',
          procedures: [
            '- [ ] Gå gjennom mal for engasjementsbrev',
            '- [ ] Tilpass til klientens forhold',
            '- [ ] Innhent godkjenning fra ledelsen',
            '',
            'Resultat: Arkiver signert brev og dokumenter eventuelle forutsetninger.'
          ].join('\n')
        },
        {
          name: 'Oppstartsmøte/teammøte – agenda og referat',
          description: 'Planlegg og gjennomfør oppstartsmøte. Agenda fra mal; referat arkiveres under handlingen.',
          subject_area: 'other' as const,
          action_type: 'observation' as const,
          risk_level: 'medium',
          procedures: [
            '- [ ] Hent agendamal og tilpass',
            '- [ ] Gjennomfør møte og dokumenter beslutninger',
            '- [ ] Lagre referat og oppfølgingspunkter',
            '',
            'Resultat: Oppsummer hovedpunkter og ansvarlige.'
          ].join('\n')
        }
      ];

      const planningItems = [
        {
          name: 'Analytiske innledende handlinger',
          description: 'Utfør overordnet analyse av regnskapsdata for å identifisere risikoområder.',
          subject_area: 'finance' as const,
          action_type: 'analytical' as const,
          risk_level: 'medium',
          procedures: [
            '- [ ] Last inn saldobalanse og nøkkeltall',
            '- [ ] Utfør trend- og forholdsanalyser',
            '- [ ] Identifiser avvik og mulige risikoområder',
            '',
            'Resultat: Dokumenter funn og planlagt respons.'
          ].join('\n')
        },
        {
          name: 'Kontroll av inngående balanse (ISA 210)',
          description: 'Avstem IB mot UB foregående år og vurder eventuelle differanser.',
          subject_area: 'finance' as const,
          action_type: 'recalculation' as const,
          risk_level: 'high',
          procedures: [
            '- [ ] Hent UB foregående år',
            '- [ ] Sammenlign mot IB inneværende år',
            '- [ ] Undersøk og forklar differanser',
            '',
            'Resultat: Dokumenter konklusjon og behov for justeringer.'
          ].join('\n')
        },
        {
          name: 'Vurdering av fortsatt drift',
          description: 'Vurder forutsetningen om fortsatt drift basert på tilgjengelig informasjon.',
          subject_area: 'finance' as const,
          action_type: 'analytical' as const,
          risk_level: 'high',
          procedures: [
            '- [ ] Gå gjennom kontantstrøm og kapitalstruktur',
            '- [ ] Vurder hendelser etter balansedagen',
            '- [ ] Diskuter med ledelsen og vurder tiltak',
            '',
            'Resultat: Dokumenter vurdering, indikatorer og konklusjon.'
          ].join('\n')
        }
      ];

      const packageItems = phase === 'engagement' ? engagementItems : phase === 'planning' ? planningItems : [];

      if (packageItems.length === 0) {
        throw new Error('Standardpakke er foreløpig kun tilgjengelig for Oppdragsvurdering og Planlegging.');
      }

      const clientActions = packageItems.map((item, idx) => ({
        client_id: clientId,
        template_id: null,
        assigned_to: null,
        reviewed_by: null,
        subject_area: item.subject_area,
        action_type: item.action_type,
        status: 'not_started' as const,
        phase: phaseDb,
        sort_order: idx,
        name: item.name,
        description: item.description,
        objective: null,
        procedures: item.procedures,
        documentation_requirements: null,
        estimated_hours: null,
        risk_level: item.risk_level,
        findings: null,
        conclusion: null,
        work_notes: null,
        copied_from_client_id: null,
        copied_from_action_id: null
      }));

      const { data, error } = await supabase
        .from('client_audit_actions')
        .insert(clientActions)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client-audit-actions', variables.clientId] });
      toast({
        title: 'Standardpakke lagt til',
        description: `${data.length} revisjonshandlinger ble lagt til for fasen.`,
      });
    },
    onError: (error: any) => {
      logger.error('Error applying standard package:', error);
      toast({
        title: 'Kunne ikke legge til standardpakke',
        description: error?.message || 'Ukjent feil',
        variant: 'destructive'
      });
    }
  });
}

