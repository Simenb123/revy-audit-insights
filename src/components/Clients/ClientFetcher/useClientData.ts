
import { logger } from '@/utils/logger';

import { useQuery } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { toast } from '@/hooks/use-toast';
import { Client, AuditPhase, ClientRole, RiskArea, ClientDocument, Announcement } from '@/types/revio';

/**
 * Fetches client data along with related roles, announcements and documents.
 *
 * @returns {UseQueryResult<Client[]>} React Query object containing the clients data.
 */
export function useClientData() {
  const { connectionStatus } = useAuth();
  
  return useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      // If no connection to Supabase, return demo data
      if (connectionStatus === 'disconnected' || !isSupabaseConfigured) {
        logger.log('useClientData: No Supabase connection, returning demo data');
        return createDemoClients();
      }
      
      logger.log('=== STARTING CLIENT DATA FETCH ===');
      
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select(`
          *,
          client_roles ( * ),
          announcements ( * )
        `)
        .order('created_at', { ascending: false });

      if (clientsError) {
        logger.error('Error fetching clients:', clientsError);
        toast({
          title: "Feil ved lasting av klienter",
          description: clientsError.message,
          variant: "destructive"
        });
        return [];
      }

      logger.log('Raw clients data from database:', clientsData);
      
      const { data: riskAreasData, error: riskAreasError } = await supabase
        .from('risk_areas')
        .select('*');

      if (riskAreasError) {
        logger.error("Error fetching risk areas:", riskAreasError);
      }

      const { data: documentsData, error: documentsError } = await supabase
        .from('client_documents')
        .select('*');

      if (documentsError) {
        logger.error("Error fetching client documents:", documentsError);
      }
      
      const transformedClients = clientsData.map(client => {
        const clientRiskAreas: RiskArea[] = (riskAreasData || [])
          .filter(area => area.client_id === client.id)
          .map(area => ({
            name: area.name,
            risk: area.risk as 'low' | 'medium' | 'high'
          }));

        const clientDocuments: ClientDocument[] = (documentsData || [])
          .filter(doc => doc.client_id === client.id)
          .map(doc => ({
            type: doc.type,
            status: doc.status,
            dueDate: doc.due_date
          }));
        
        // These are now directly fetched with the client
        const clientRoles: ClientRole[] = (client.client_roles as any) || [];
        const clientAnnouncements: Announcement[] = ((client.announcements as any) || []).map((a: any) => ({ ...a, isRead: a.is_read }));


        if (clientRiskAreas.length === 0) {
          clientRiskAreas.push({ name: 'Generell', risk: 'low' });
        }
        
        if (clientDocuments.length === 0) {
          clientDocuments.push({
            type: 'annual_report',
            status: 'pending',
            dueDate: new Date().toISOString().split('T')[0]
          });
        }

        let mappedPhase: AuditPhase;
        switch (client.phase as string) {
          case 'conclusion':
            mappedPhase = 'completion';  // Map conclusion to completion
            break;
          case 'engagement':
          case 'planning':
          case 'execution':
          case 'completion':
          case 'reporting':
          case 'risk_assessment':
          case 'overview':
            mappedPhase = client.phase as AuditPhase;
            break;
          default:
            mappedPhase = 'overview';
            break;
        }

        const { client_roles, announcements, ...remainingClientData } = client;

        const transformedClient: Client = {
          ...remainingClientData,
          phase: mappedPhase,
          riskAreas: clientRiskAreas,
          documents: clientDocuments,
          roles: clientRoles,
          announcements: clientAnnouncements,
          equity_capital: client.equity_capital != null ? Number(client.equity_capital) : null,
          share_capital: client.share_capital != null ? Number(client.share_capital) : null,
          audit_fee: client.audit_fee != null ? Number(client.audit_fee) : null,
          board_meetings_per_year: client.board_meetings_per_year != null ? Number(client.board_meetings_per_year) : null,
          is_test_data: Boolean(client.is_test_data),
        };

        return transformedClient;
      });

      logger.log('=== TRANSFORMATION COMPLETE ===');
      logger.log('Final transformed clients:', transformedClients.length);
      
      return transformedClients;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
    enabled: true // Always enabled, will handle connection status internally
  });
}

// Demo data for when Supabase is not connected
function createDemoClients(): Client[] {
  return [
    {
      id: 'demo-client-1',
      user_id: 'demo-user-id',
      name: 'Demo Klient AS',
      company_name: 'Demo Klient AS',
      org_number: '123456789',
      phase: 'planning' as AuditPhase,
      progress: 45,
      industry: 'Teknologi',
      contact_person: 'Ola Nordmann',
      email: 'ola@democlient.no',
      phone: '+47 12345678',
      address: 'Demogate 1',
      postal_code: '0001',
      city: 'Oslo',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      riskAreas: [
        { name: 'Inntektsføring', risk: 'medium' as const },
        { name: 'Varelagervurdering', risk: 'low' as const }
      ],
      documents: [
        { type: 'annual_report', status: 'pending', dueDate: '2024-03-31' }
      ],
      roles: [],
      announcements: [],
      equity_capital: 1000000,
      share_capital: 500000,
      audit_fee: 75000,
      board_meetings_per_year: 4,
      is_test_data: true
    }
  ];
}
