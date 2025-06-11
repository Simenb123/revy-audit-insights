
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
      switch (clientData.phase) {
        case 'conclusion':
          mappedPhase = 'completion';
          break;
        default:
          mappedPhase = clientData.phase as AuditPhase;
          break;
      }

      // Transform data to match our Client type
      const client: Client = {
        id: clientData.id,
        name: clientData.name,
        companyName: clientData.company_name,
        orgNumber: clientData.org_number,
        phase: mappedPhase,
        progress: clientData.progress,
        department: clientData.department || '',
        contactPerson: clientData.contact_person || '',
        chair: clientData.chair || '',
        ceo: clientData.ceo || '',
        industry: clientData.industry || '',
        registrationDate: clientData.registration_date || '',
        address: clientData.address || '',
        postalCode: clientData.postal_code || '',
        city: clientData.city || '',
        email: clientData.email || '',
        phone: clientData.phone || '',
        bankAccount: clientData.bank_account || '',
        notes: clientData.notes || '',
        orgFormCode: clientData.org_form_code || '',
        orgFormDescription: clientData.org_form_description || '',
        homepage: clientData.homepage || '',
        status: clientData.status || '',
        naceCode: clientData.nace_code || '',
        naceDescription: clientData.nace_description || '',
        municipalityCode: clientData.municipality_code || '',
        municipalityName: clientData.municipality_name || '',
        equityCapital: clientData.equity_capital != null ? Number(clientData.equity_capital) : undefined,
        shareCapital: clientData.share_capital != null ? Number(clientData.share_capital) : undefined,
        accountingSystem: clientData.accounting_system || '',
        previousAuditor: clientData.previous_auditor || '',
        auditFee: clientData.audit_fee != null ? Number(clientData.audit_fee) : undefined,
        yearEndDate: clientData.year_end_date || '',
        boardMeetingsPerYear: clientData.board_meetings_per_year != null ? Number(clientData.board_meetings_per_year) : undefined,
        internalControls: clientData.internal_controls || '',
        riskAssessment: clientData.risk_assessment || '',
        isTestData: Boolean(clientData.is_test_data),
        createdAt: clientData.created_at,
        updatedAt: clientData.updated_at,
        riskAreas: [],
        documents: [],
        roles: []
      };

      // Fetch risk areas, documents and roles if needed
      // This could be expanded based on your requirements

      return client;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
