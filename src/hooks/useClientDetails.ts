
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Client, AuditPhase } from '@/types/revio';
import { toast } from '@/components/ui/use-toast';

export function useClientDetails(orgNumber: string) {
  return useQuery({
    queryKey: ['client', orgNumber],
    queryFn: async (): Promise<Client | null> => {
      // Fetch client data
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('org_number', orgNumber)
        .single();

      if (clientError) {
        if (clientError.code !== 'PGRST116') { // No rows returned
          toast({
            title: "Feil ved lasting av klientdata",
            description: clientError.message,
            variant: "destructive"
          });
        }
        return null;
      }

      // Map database phase values to our AuditPhase type
      let mappedPhase: AuditPhase;
      switch (clientData.phase as any) {
        case 'conclusion':
          mappedPhase = 'completion';
          break;
        case 'reporting': // Map reporting to a valid phase or handle it
          mappedPhase = 'reporting';
          break;
        default:
          mappedPhase = clientData.phase as AuditPhase;
          break;
      }

      // Transform data to match our Client type
      const client: Client = {
        ...clientData,
        id: clientData.id,
        name: clientData.name,
        company_name: clientData.company_name,
        org_number: clientData.org_number,
        phase: mappedPhase,
        progress: clientData.progress,
        department: clientData.department || '',
        contact_person: clientData.contact_person || '',
        chair: clientData.chair || '',
        ceo: clientData.ceo || '',
        industry: clientData.industry || '',
        registration_date: clientData.registration_date || '',
        address: clientData.address || '',
        postal_code: clientData.postal_code || '',
        city: clientData.city || '',
        email: clientData.email || '',
        phone: clientData.phone || '',
        bank_account: clientData.bank_account || '',
        notes: clientData.notes || '',
        org_form_code: clientData.org_form_code || '',
        org_form_description: clientData.org_form_description || '',
        homepage: clientData.homepage || '',
        status: clientData.status || '',
        nace_code: clientData.nace_code || '',
        nace_description: clientData.nace_description || '',
        municipality_code: clientData.municipality_code || '',
        municipality_name: clientData.municipality_name || '',
        equity_capital: clientData.equity_capital != null ? Number(clientData.equity_capital) : null,
        share_capital: clientData.share_capital != null ? Number(clientData.share_capital) : null,
        accounting_system: clientData.accounting_system || '',
        previous_auditor: clientData.previous_auditor || '',
        audit_fee: clientData.audit_fee != null ? Number(clientData.audit_fee) : null,
        year_end_date: clientData.year_end_date || '',
        board_meetings_per_year: clientData.board_meetings_per_year != null ? Number(clientData.board_meetings_per_year) : null,
        internal_controls: clientData.internal_controls || '',
        risk_assessment: clientData.risk_assessment || '',
        is_test_data: Boolean(clientData.is_test_data),
        created_at: clientData.created_at,
        updated_at: clientData.updated_at,
        riskAreas: [],
        documents: [],
        roles: [],
        announcements: [],
      };

      // Fetch risk areas, documents and roles if needed
      // This could be expanded based on your requirements

      return client;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
