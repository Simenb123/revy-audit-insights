
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Client, AuditPhase, ClientRole, RiskArea, ClientDocument, Announcement } from '@/types/revio';

export function useClientData() {
  return useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      console.log('=== STARTING CLIENT DATA FETCH ===');
      
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select(`
          *,
          client_roles ( * ),
          announcements ( * )
        `)
        .order('created_at', { ascending: false });

      if (clientsError) {
        console.error('Error fetching clients:', clientsError);
        toast({
          title: "Feil ved lasting av klienter",
          description: clientsError.message,
          variant: "destructive"
        });
        return [];
      }

      console.log('Raw clients data from database:', clientsData);
      
      const { data: riskAreasData, error: riskAreasError } = await supabase
        .from('risk_areas')
        .select('*');

      if (riskAreasError) {
        console.error("Error fetching risk areas:", riskAreasError);
      }

      const { data: documentsData, error: documentsError } = await supabase
        .from('client_documents')
        .select('*');

      if (documentsError) {
        console.error("Error fetching client documents:", documentsError);
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
            mappedPhase = 'completion';
            break;
          case 'engagement':
          case 'planning':
          case 'execution':
          case 'completion':
          case 'reporting':
          case 'risk_assessment':
          case 'overview':
            mappedPhase = client.phase;
            break;
          default:
            mappedPhase = 'overview';
            break;
        }

        const { client_roles, announcements, ...remaningClientData } = client;

        const transformedClient: Client = {
          ...remaningClientData,
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

      console.log('=== TRANSFORMATION COMPLETE ===');
      console.log('Final transformed clients:', transformedClients.length);
      
      return transformedClients;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true
  });
}
